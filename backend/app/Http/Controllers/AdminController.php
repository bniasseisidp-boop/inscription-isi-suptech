<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Payment;
use App\Models\Filiere;
use App\Models\License;
use App\Models\MoisDesactive;
use App\Models\StudentNotification;
use App\Services\PDFService;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use App\Mail\InscriptionAccepted;
use App\Mail\DossierIncomplet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function __construct(
        private PDFService $pdfService,
        private QRCodeService $qrService,
    ) {}

    /** Dashboard stats — candidatures annulées exclues du total */
    public function stats()
    {
        $actifs = Student::whereIn('statut_inscription', ['en_attente', 'en_attente_paiement', 'accepte']);

        return response()->json([
            'total_etudiants'        => (clone $actifs)->count(),
            'en_attente'             => Student::where('statut_inscription', 'en_attente')->count(),
            'en_attente_paiement'    => Student::where('statut_inscription', 'en_attente_paiement')->count(),
            'acceptes'               => Student::where('statut_inscription', 'accepte')->count(),
            'rejetes'                => Student::where('statut_inscription', 'rejete')->count(),
            'inscriptions_payees'    => Student::where('inscription_payee', true)->count(),
            'total_paiements'        => Payment::where('statut', 'complete')->sum('montant'),
            'paiements_ce_mois'      => Payment::where('statut', 'complete')
                ->whereMonth('date_paiement', now()->month)->sum('montant'),
            'par_filiere'            => Student::whereIn('statut_inscription', ['en_attente_paiement', 'accepte'])
                ->with('filiere')->get()
                ->groupBy(fn($s) => $s->filiere?->nom ?? 'Autre')
                ->map->count(),
        ]);
    }

    /** List all students with filters */
    public function students(Request $request)
    {
        $query = Student::with(['filiere', 'license', 'user'])
            ->when($request->statut, fn($q) => $q->where('statut_inscription', $request->statut))
            ->when($request->filiere_id, fn($q) => $q->where('filiere_id', $request->filiere_id))
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->latest();

        return response()->json($query->paginate(20));
    }

    /**
     * Completer/corriger le profil complet d'un etudiant (infos academiques,
     * tuteur, contacts d'urgence, medical...) — utilise par Admin et Accueil
     * Pedagogique, notamment pour les etudiants inscrits directement au guichet
     * (formulaire d'inscription rapide) dont le profil est incomplet.
     */
    public function updateStudentProfile(Request $request, Student $student)
    {
        $validated = $request->validate([
            // Identité
            'nom'                => 'sometimes|string|max:100',
            'prenom'             => 'sometimes|string|max:100',
            'email'              => 'sometimes|email|max:150',
            'telephone'          => 'sometimes|string|max:30',
            'sexe'               => 'sometimes|in:M,F',
            'date_naissance'     => 'sometimes|date',
            'lieu_naissance'     => 'sometimes|string|max:150',
            'adresse'            => 'sometimes|string|max:255',
            'nationalite'        => 'sometimes|string|max:100',
            'pays_residence'     => 'sometimes|string|max:100',
            'filiere_id'         => 'sometimes|exists:filieres,id',
            'license_id'         => 'sometimes|exists:licenses,id',
            'statut_inscription' => 'sometimes|in:en_attente,en_attente_paiement,accepte,rejete',
            'photo'              => 'nullable|image|max:3072',
            // Académique
            'annee_bac'             => 'nullable|string|max:20',
            'numero_pv_bac'         => 'nullable|string|max:50',
            'serie_college'         => 'nullable|string|max:50',
            'region_bac'            => 'nullable|string|max:100',
            'dernier_diplome'       => 'nullable|string|max:150',
            'annee_dernier_diplome' => 'nullable|string|max:20',
            'dernier_etablissement' => 'nullable|string|max:150',
            'numero_ine'            => 'nullable|string|max:50',
            'choix_specialites'     => 'nullable|string',
            'decouverte'            => 'nullable|string|max:150',
            // Personnel
            'civilite'              => 'nullable|string|max:20',
            'numero_cni'            => 'nullable|string|max:50',
            'date_delivrance_cni'   => 'nullable|date',
            'notes_personnelles'    => 'nullable|string',
            // Tuteur 1
            'tuteur_nom'            => 'nullable|string|max:150',
            'tuteur_profession'     => 'nullable|string|max:150',
            'tuteur_telephone'      => 'nullable|string|max:30',
            'tuteur_email'          => 'nullable|email|max:150',
            'tuteur_identite'       => 'nullable|string|max:50',
            // Tuteur 2
            'tuteur2_nom'           => 'nullable|string|max:150',
            'tuteur2_profession'    => 'nullable|string|max:150',
            'tuteur2_telephone'     => 'nullable|string|max:30',
            'tuteur2_email'         => 'nullable|email|max:150',
            // Surveillance
            'surveillance_mail'     => 'nullable|boolean',
            'surveillance_telephone'=> 'nullable|boolean',
            // Autres
            'cursus_deux_ans'       => 'nullable|string',
            'langues'               => 'nullable|string',
            'logiciels'             => 'nullable|string',
            'experiences'           => 'nullable|string',
            'traitement_medical'    => 'nullable|string|max:255',
            'allergies'             => 'nullable|string|max:255',
            'vaccinations'          => 'nullable|string|max:255',
            'contact_urgence1'      => 'nullable|string|max:150',
            'tel_urgence1'          => 'nullable|string|max:30',
            'contact_urgence2'      => 'nullable|string|max:150',
            'tel_urgence2'          => 'nullable|string|max:30',
            'medecin_famille'       => 'nullable|string|max:150',
            'tel_medecin'           => 'nullable|string|max:30',
        ]);

        if (array_key_exists('email', $validated)) {
            $email = $validated['email'];
            unset($validated['email']);
            if ($student->user && $student->user->email !== $email) {
                $student->user->update(['email' => $email]);
            }
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('photos', 'public');
        }

        $student->update($validated);

        \App\Services\ActivityLogger::log(
            $request->user(), 'student.profile_update',
            "Profil complete/modifie pour {$student->prenom} {$student->nom} ({$student->matricule})", $student
        );

        return response()->json($student->fresh(['filiere', 'license', 'user']));
    }

    /** Accept student inscription → en_attente_paiement */
    public function acceptStudent(Request $request, Student $student)
    {
        $request->validate(['notes' => 'nullable|string']);

        $matricule = Student::generateMatricule();

        $student->update([
            'statut_inscription' => 'en_attente_paiement',
            'date_acceptation'   => now(),
            'accepte_par'        => $request->user()->id,
            'matricule'          => $matricule,
            'notes_admin'        => $request->notes,
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '🎉 Dossier accepté — Paiement requis',
            'message'    => "Félicitations ! Votre dossier a été validé. Votre matricule provisoire est : {$matricule}. Votre inscription sera confirmée dès réception de vos frais d'inscription (paiement Wave ou en caisse).",
            'type'       => 'success',
        ]);

        $pdfPath = null;
        try {
            $pdfPath = $this->pdfService->generateAcceptanceLetter($student);
        } catch (\Exception $e) {
            \Log::warning('PDF lettre acceptation: ' . $e->getMessage());
        }

        if ($student->user?->email) {
            try {
                Mail::to($student->user->email)->send(new InscriptionAccepted($student, $pdfPath));
            } catch (\Exception $e) {
                \Log::error('Email acceptation non envoyé à ' . $student->user->email . ': ' . $e->getMessage());
            }
        }

        \App\Services\ActivityLogger::log(
            $request->user(), 'student.accept',
            "Dossier accepté pour {$student->prenom} {$student->nom} (matricule {$matricule})",
            $student
        );

        return response()->json([
            'message' => 'Dossier accepté — étudiant mis en attente de paiement',
            'student' => $student->fresh(['filiere', 'license']),
        ]);
    }

    /** Lock student profile — student can no longer edit it */
    public function lockProfile(Request $request, Student $student)
    {
        $student->update([
            'profil_verrouille'    => true,
            'profil_verrouille_par'=> $request->user()->id,
            'profil_verrouille_le' => now(),
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '🔒 Dossier validé et verrouillé',
            'message'    => 'Vos informations ont été vérifiées et validées par l\'administration ISI SUPTECH. Votre dossier est maintenant complet. Contactez l\'école pour toute modification.',
            'type'       => 'success',
        ]);

        \App\Services\ActivityLogger::log(
            $request->user(), 'student.lock', "Profil verrouillé pour {$student->prenom} {$student->nom}", $student
        );

        return response()->json([
            'message' => 'Profil verrouillé avec succès.',
            'student' => $student->fresh(),
        ]);
    }

    /** Reject student inscription */
    public function rejectStudent(Request $request, Student $student)
    {
        $request->validate(['motif' => 'required|string']);

        $dateLimite = now()->addDays(30);

        $student->update([
            'statut_inscription' => 'rejete',
            'notes_admin'        => $request->motif,
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '📋 Dossier à compléter',
            'message'    => $request->motif,
            'type'       => 'warning',
        ]);

        if ($student->user?->email) {
            try {
                Mail::to($student->user->email)->send(new DossierIncomplet($student, $request->motif, $dateLimite));
            } catch (\Exception $e) {
                \Log::error('Email dossier incomplet non envoyé à ' . $student->user->email . ': ' . $e->getMessage());
            }
        }

        \App\Services\ActivityLogger::log(
            $request->user(), 'student.reject',
            "Dossier renvoyé à compléter pour {$student->prenom} {$student->nom} — {$request->motif}",
            $student
        );

        return response()->json(['message' => "Message envoyé à l'étudiant — dossier à compléter sous 30 jours"]);
    }

    /** Admin manually creates a student */
    public function createStudent(Request $request)
    {
        $validated = $request->validate([
            'nom'            => 'required|string|max:100',
            'prenom'         => 'required|string|max:100',
            'email'          => 'required|email|unique:users,email',
            'telephone'      => 'required|string|max:20',
            'sexe'           => 'required|in:M,F',
            'date_naissance' => 'required|date',
            'lieu_naissance' => 'required|string|max:100',
            'adresse'        => 'required|string|max:255',
            'nationalite'    => 'required|string|max:100',
            'pays_residence' => 'required|string|max:100',
            'filiere_id'     => 'required|exists:filieres,id',
            'license_id'     => 'required|exists:licenses,id',
            'statut'         => 'required|in:en_attente,accepte',
            'photo'          => 'nullable|image|max:2048',
        ]);

        $photoPath = $request->hasFile('photo')
            ? $request->file('photo')->store('photos', 'public')
            : null;

        $tempPassword = \Str::random(10);
        $user = User::create([
            'name'     => Student::capitaliserNomPropre($validated['prenom']) . ' ' . Student::capitaliserNomPropre($validated['nom']),
            'email'    => $validated['email'],
            'password' => Hash::make($tempPassword),
            'role'     => 'student',
        ]);

        $student = Student::create(array_merge($validated, [
            'user_id'          => $user->id,
            'photo'            => $photoPath,
            'annee_scolaire'   => date('Y') . '-' . (date('Y') + 1),
            'statut_inscription' => $validated['statut'],
        ]));

        if ($validated['statut'] === 'accepte') {
            $student->update([
                'matricule'        => Student::generateMatricule(),
                'date_acceptation' => now(),
                'accepte_par'      => $request->user()->id,
            ]);
            $this->qrService->generateStudentCard($student);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->send(new \App\Mail\StudentInvite($user, $tempPassword, $student->fresh()));
        } catch (\Exception $e) {
            \Log::warning('Email invitation étudiant (admin): ' . $e->getMessage());
        }

        return response()->json(['message' => 'Étudiant créé', 'student' => $student->fresh()], 201);
    }

    /** Admin/pédagogique upload ou remplace un document pour le compte de l'étudiant (dépôt en personne, scan) */
    public function uploadDocument(Request $request, Student $student)
    {
        $request->validate([
            'champ' => 'required|in:doc_bac,doc_releve_notes,doc_cin,doc_acte_naissance,doc_bulletin_transfert',
            'fichier' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $path = $request->file('fichier')->store('documents/inscriptions', 'public');
        $student->update([$request->champ => $path]);

        return response()->json([
            'message' => 'Document enregistré',
            'student' => $student->fresh(),
        ]);
    }

    /** Generate/regenerate student card */
    public function generateCard(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée'], 422);
        }

        $card = $this->qrService->generateStudentCard($student);
        $this->pdfService->generateStudentCard($student);

        return response()->json(['message' => 'Carte générée', 'card' => $card]);
    }

    // ── Documents étudiant (attestations, certificats, diplôme) — Admin ────────

    private function checkAccepte(Student $student): ?\Illuminate\Http\JsonResponse
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        return null;
    }

    public function downloadAttestationScolarite(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationScolarite($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_scolarite_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationInscription(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationInscription($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_inscription_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadFicheInscription(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateFicheInscription($student);
        return response()->download(Storage::disk('public')->path($path),
            'fiche_inscription_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadCertificatScolarite(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateCertificatScolarite($student);
        return response()->download(Storage::disk('public')->path($path),
            'certificat_scolarite_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationFormation(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationFormation($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_formation_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationNonSoutenance(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationNonSoutenance($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_non_soutenance_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Mention saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadAttestationReussite(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateAttestationReussite($student, $validated['mention']);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_reussite_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Moyenne saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadAttestationEncouragement(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['moyenne' => 'required|string|max:10', 'periode' => 'required|string|max:50']);
        $path = $this->pdfService->generateAttestationEncouragement($student, $validated['moyenne'], $validated['periode']);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_encouragement_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Mention saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadDiplomeLicence(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateDiplomeLicence($student, $validated['mention']);
        return response()->download(Storage::disk('public')->path($path),
            'diplome_licence_' . ($student->matricule ?? $student->id) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Manage filieres and licenses */
    public function filieres()
    {
        return response()->json(Filiere::with('licenses')->where('actif', true)->get());
    }

    public function createFiliere(Request $request)
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:100',
            'code'        => 'required|string|max:20|unique:filieres',
            'description' => 'nullable|string',
        ]);
        return response()->json(Filiere::create($validated), 201);
    }

    public function createLicense(Request $request)
    {
        $validated = $request->validate([
            'filiere_id'        => 'required|exists:filieres,id',
            'nom'               => 'required|string|max:100',
            'code'              => 'required|string|max:20|unique:licenses',
            'duree_annees'      => 'required|integer|min:1|max:5',
            'mois_debut'        => 'required|integer|min:1|max:12',
            'mois_fin'          => 'required|integer|min:1|max:12',
            'frais_inscription' => 'required|numeric|min:0',
            'frais_mensuel'     => 'required|numeric|min:0',
        ]);
        return response()->json(License::create($validated), 201);
    }

    private function checkFiliereLock(Request $request): bool
    {
        if ($request->user()->role === 'pedagogique') {
            $locked = \DB::table('site_settings')->where('cle', 'filieres_lock_pedagogique')->value('valeur');
            return $locked === '1';
        }
        return false;
    }

    public function updateFiliere(Request $request, Filiere $filiere)
    {
        if ($this->checkFiliereLock($request)) {
            return response()->json(['message' => 'Modifications verrouillées par l\'administrateur.'], 403);
        }
        $validated = $request->validate([
            'nom'         => 'required|string|max:100',
            'code'        => 'required|string|max:20|unique:filieres,code,' . $filiere->id,
            'description' => 'nullable|string',
        ]);
        $filiere->update($validated);
        return response()->json(Filiere::with('licenses')->find($filiere->id));
    }

    public function deleteFiliere(Request $request, Filiere $filiere)
    {
        if ($this->checkFiliereLock($request)) {
            return response()->json(['message' => 'Modifications verrouillées par l\'administrateur.'], 403);
        }
        $count = Student::where('filiere_id', $filiere->id)->count();
        if ($count > 0) {
            return response()->json(['message' => "Impossible : {$count} étudiant(s) sont inscrits dans cette filière."], 422);
        }
        $filiere->delete();
        return response()->json(['message' => 'Filière supprimée.']);
    }

    public function updateLicense(Request $request, License $license)
    {
        if ($this->checkFiliereLock($request)) {
            return response()->json(['message' => 'Modifications verrouillées par l\'administrateur.'], 403);
        }
        $validated = $request->validate([
            'nom'               => 'required|string|max:100',
            'mois_debut'        => 'required|integer|min:1|max:12',
            'mois_fin'          => 'required|integer|min:1|max:12',
            'frais_inscription' => 'required|numeric|min:0',
            'frais_mensuel'     => 'required|numeric|min:0',
        ]);
        $license->update($validated);
        return response()->json($license->fresh());
    }

    public function deleteLicense(Request $request, License $license)
    {
        if ($this->checkFiliereLock($request)) {
            return response()->json(['message' => 'Modifications verrouillées par l\'administrateur.'], 403);
        }
        $count = Student::where('license_id', $license->id)->count();
        if ($count > 0) {
            return response()->json(['message' => "Impossible : {$count} étudiant(s) ont ce niveau."], 422);
        }
        $license->delete();
        return response()->json(['message' => 'Niveau supprimé.']);
    }

    public function getSettings()
    {
        $s = \DB::table('site_settings')->pluck('valeur', 'cle');
        return response()->json([
            'filieres_lock_pedagogique' => ($s['filieres_lock_pedagogique'] ?? '0') === '1',
            'frais_amea'                => floatval($s['frais_amea']      ?? 10000),
            'frais_tenue'               => floatval($s['frais_tenue']     ?? 60000),
            'frais_assurance'           => floatval($s['frais_assurance'] ?? 10000),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'filieres_lock_pedagogique' => 'sometimes|boolean',
            'frais_amea'                => 'sometimes|numeric|min:0',
            'frais_tenue'               => 'sometimes|numeric|min:0',
            'frais_assurance'           => 'sometimes|numeric|min:0',
        ]);

        if (array_key_exists('filieres_lock_pedagogique', $validated)) {
            \DB::table('site_settings')->updateOrInsert(
                ['cle' => 'filieres_lock_pedagogique'],
                ['valeur' => $validated['filieres_lock_pedagogique'] ? '1' : '0', 'updated_at' => now(), 'created_at' => now()]
            );
        }
        foreach (['frais_amea', 'frais_tenue', 'frais_assurance'] as $key) {
            if (isset($validated[$key])) {
                \DB::table('site_settings')->updateOrInsert(
                    ['cle' => $key],
                    ['valeur' => (string) $validated[$key], 'updated_at' => now(), 'created_at' => now()]
                );
            }
        }

        $s = \DB::table('site_settings')->pluck('valeur', 'cle');
        return response()->json([
            'filieres_lock_pedagogique' => ($s['filieres_lock_pedagogique'] ?? '0') === '1',
            'frais_amea'                => floatval($s['frais_amea']      ?? 10000),
            'frais_tenue'               => floatval($s['frais_tenue']     ?? 60000),
            'frais_assurance'           => floatval($s['frais_assurance'] ?? 10000),
        ]);
    }

    public function getPedagogiqueSettings()
    {
        $locked = \DB::table('site_settings')->where('cle', 'filieres_lock_pedagogique')->value('valeur');
        return response()->json([
            'filieres_locked' => $locked === '1',
        ]);
    }

    /** Reset all test data (students, payments, notifications) — keeps user accounts */
    public function resetDonneesTest(Request $request)
    {
        $request->validate(['confirmation' => 'required|in:RESET_CONFIRMED']);

        // Delete all PDFs and generated files
        try {
            Storage::disk('public')->deleteDirectory('receipts');
            Storage::disk('public')->deleteDirectory('letters');
            Storage::disk('public')->deleteDirectory('cards');
            Storage::disk('public')->deleteDirectory('impayes');
            Storage::disk('public')->deleteDirectory('photos');
        } catch (\Throwable $e) {
            \Log::warning('Reset storage: ' . $e->getMessage());
        }

        // Truncate data tables (keep staff/admin users, filieres, licenses).
        // MySQL, pas SQLite : PRAGMA n'existe pas ici, il faut FOREIGN_KEY_CHECKS.
        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Payment::query()->forceDelete();
        \App\Models\StudentCard::query()->forceDelete();
        \App\Models\PaymentEditRequest::query()->delete();
        \App\Models\ActivityLog::query()->delete();
        StudentNotification::query()->truncate();
        Student::withTrashed()->forceDelete();
        // Delete student user accounts so emails can be reused
        User::where('role', 'student')->delete();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        \App\Services\ActivityLogger::log(
            $request->user(), 'system.reset_test_data', 'Réinitialisation des données de test (étudiants, paiements, cartes, notifications).'
        );

        return response()->json(['message' => 'Toutes les données de test ont été supprimées.']);
    }

    /** Delete every account (students + staff) except super_admin — full reset for testing */
    public function deleteAllAccounts(Request $request)
    {
        $request->validate(['confirmation' => 'required|in:DELETE_ALL_CONFIRMED']);

        try {
            Storage::disk('public')->deleteDirectory('receipts');
            Storage::disk('public')->deleteDirectory('letters');
            Storage::disk('public')->deleteDirectory('cards');
            Storage::disk('public')->deleteDirectory('impayes');
            Storage::disk('public')->deleteDirectory('photos');
            Storage::disk('public')->deleteDirectory('brouillards');
        } catch (\Throwable $e) {
            \Log::warning('Delete all accounts storage: ' . $e->getMessage());
        }

        \DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Payment::query()->forceDelete();
        \App\Models\StudentCard::query()->forceDelete();
        \App\Models\PaymentEditRequest::query()->delete();
        \App\Models\ActivityLog::query()->delete();
        StudentNotification::query()->truncate();
        Student::withTrashed()->forceDelete();
        \DB::table('personal_access_tokens')->truncate();
        User::where('role', '!=', 'super_admin')->delete();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        \App\Services\ActivityLogger::log(
            $request->user(), 'system.delete_all_accounts', 'Suppression définitive de tous les comptes (sauf super admin) et de leurs données.'
        );

        return response()->json(['message' => 'Tous les comptes (sauf super admin) ont été supprimés définitivement.']);
    }

    /** List staff accounts */
    public function staff()
    {
        return response()->json(User::whereIn('role', ['admin', 'cashier', 'accueil', 'pedagogique'])->get());
    }

    public function createStaff(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'role'  => 'required|in:admin,cashier,accueil,pedagogique',
        ]);

        // Mot de passe temporaire généré automatiquement — jamais saisi par le
        // super admin, envoyé uniquement par email ; l'intéressé le change à sa
        // première connexion.
        $tempPassword = \Str::random(10);
        $user = User::create(array_merge($validated, [
            'password' => Hash::make($tempPassword),
        ]));

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->send(new \App\Mail\StaffInvite($user, $tempPassword));
        } catch (\Exception $e) {
            \Log::warning('Email invitation staff: ' . $e->getMessage());
        }

        \App\Services\ActivityLogger::log(
            $request->user(), 'staff.create', "Compte {$user->role} créé pour {$user->name} ({$user->email})", $user
        );

        return response()->json($user, 201);
    }

    /** Delete a staff member */
    public function deleteStaff(Request $request, User $user)
    {
        if ($user->role === 'student') {
            return response()->json(['message' => 'Utilisez la gestion étudiants pour supprimer un étudiant.'], 422);
        }

        \App\Services\ActivityLogger::log(
            $request->user(), 'staff.delete', "Compte {$user->role} supprimé : {$user->name} ({$user->email})"
        );

        $user->delete();
        return response()->json(['message' => 'Membre supprimé.']);
    }

    /** Change a staff member's role — super admin only (voir route). */
    public function updateStaffRole(Request $request, User $user)
    {
        if (!in_array($user->role, ['admin', 'cashier', 'accueil', 'pedagogique'], true)) {
            return response()->json(['message' => "Ce compte n'est pas un compte staff."], 422);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,cashier,accueil,pedagogique',
        ]);

        $ancienRole = $user->role;
        $user->update(['role' => $validated['role']]);

        \App\Services\ActivityLogger::log(
            $request->user(), 'staff.role_update',
            "Rôle changé pour {$user->name} ({$user->email}) : {$ancienRole} → {$validated['role']}", $user
        );

        return response()->json($user);
    }

    /** All payments report */
    public function payments(Request $request)
    {
        $payments = Payment::with(['student.filiere', 'student.license', 'saiseur'])
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->mois, fn($q) => $q->where('mois', $request->mois))
            ->latest()
            ->paginate(30);

        return response()->json($payments);
    }

    /** Soft-deleted students */
    public function trashedStudents()
    {
        return response()->json(
            Student::onlyTrashed()->with(['filiere', 'license', 'user'])->latest()->get()
        );
    }

    /** Restore soft-deleted student */
    public function restoreStudent(int $id)
    {
        $student = Student::onlyTrashed()->findOrFail($id);
        $student->restore();
        return response()->json(['message' => 'Étudiant restauré']);
    }

    /** Permanently delete student — also frees up their email by deleting the linked account */
    public function forceDeleteStudent(int $id)
    {
        $student = Student::onlyTrashed()->findOrFail($id);
        $userId = $student->user_id;
        $student->forceDelete();
        User::where('id', $userId)->delete();
        return response()->json(['message' => 'Étudiant supprimé définitivement']);
    }

    /** Soft-delete student (move to trash) */
    public function deleteStudent(Student $student)
    {
        $student->delete();
        return response()->json(['message' => 'Déplacé en corbeille']);
    }

    // ── Mois désactivés ───────────────────────────────────────────────────────

    /** List disabled months */
    public function getMoisDesactives()
    {
        return response()->json(MoisDesactive::orderBy('mois')->get());
    }

    /** Toggle a month: disable it if enabled, re-enable if already disabled */
    public function toggleMoisDesactive(Request $request)
    {
        $request->validate([
            'mois'   => 'required|string|size:7|regex:/^\d{4}-\d{2}$/',
            'raison' => 'nullable|string|max:255',
        ]);

        $existing = MoisDesactive::where('mois', $request->mois)->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['message' => 'Mois réactivé', 'actif' => true]);
        }

        $mois = MoisDesactive::create([
            'mois'         => $request->mois,
            'raison'       => $request->raison,
            'desactive_par'=> $request->user()->id,
        ]);

        return response()->json(['message' => 'Mois désactivé', 'actif' => false, 'mois' => $mois]);
    }

    // ── Permissions de modification de paiement (caisse → admin) ───────────────

    /** Liste des demandes de permission (en attente en premier). */
    public function permissionsModification(Request $request)
    {
        $query = \App\Models\PaymentEditRequest::with(['payment.student', 'demandeur', 'decideur'])
            ->when($request->statut, fn ($q) => $q->where('statut', $request->statut))
            ->orderByRaw("CASE WHEN statut = 'en_attente' THEN 0 ELSE 1 END")
            ->latest();

        return response()->json($query->paginate(20));
    }

    /** Approuver une demande en un clic — la caisse pourra alors corriger CE paiement précis. */
    public function approuverPermission(Request $request, \App\Models\PaymentEditRequest $permission)
    {
        if ($permission->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $permission->update([
            'statut'     => 'approuve',
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        \App\Models\StudentNotification::create([
            'student_id' => $permission->payment->student_id,
            'titre'      => 'ℹ️ Correction de paiement autorisée',
            'message'    => "L'administrateur a autorisé une correction sur votre paiement #{$permission->payment_id}.",
            'type'       => 'info',
        ]);

        \App\Services\ActivityLogger::log(
            $request->user(), 'permission.approve',
            "Permission de modification approuvée pour le paiement #{$permission->payment_id} (demandée par {$permission->demandeur->name})",
            $permission
        );

        return response()->json(['message' => 'Permission accordée.', 'demande' => $permission->fresh()]);
    }

    /** Refuser une demande en un clic. */
    public function refuserPermission(Request $request, \App\Models\PaymentEditRequest $permission)
    {
        if ($permission->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $permission->update([
            'statut'     => 'refuse',
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        \App\Services\ActivityLogger::log(
            $request->user(), 'permission.refuse',
            "Permission de modification refusée pour le paiement #{$permission->payment_id} (demandée par {$permission->demandeur->name})",
            $permission
        );

        return response()->json(['message' => 'Permission refusée.', 'demande' => $permission->fresh()]);
    }

    // ── Journal d'audit ──────────────────────────────────────────────────────

    /** Journal d'activité système — filtrable par action, rôle, utilisateur, période. */
    public function audit(Request $request)
    {
        $query = \App\Models\ActivityLog::with('user')
            ->when($request->action, fn ($q) => $q->where('action', 'like', '%' . $request->action . '%'))
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_debut, fn ($q) => $q->whereDate('created_at', '>=', $request->date_debut))
            ->when($request->date_fin, fn ($q) => $q->whereDate('created_at', '<=', $request->date_fin))
            ->latest('created_at');

        return response()->json($query->paginate(40));
    }

    // ── Mode maintenance ─────────────────────────────────────────────────────

    /** Basculer le mode maintenance — bloque l'accès à tout sauf l'admin. */
    public function toggleMaintenance(Request $request)
    {
        $request->validate(['message' => 'nullable|string|max:255']);

        $actif = \Illuminate\Support\Facades\DB::table('site_settings')->where('cle', 'maintenance_mode')->value('valeur') === '1';
        $nouvelEtat = $actif ? '0' : '1';

        \Illuminate\Support\Facades\DB::table('site_settings')->updateOrInsert(
            ['cle' => 'maintenance_mode'],
            ['valeur' => $nouvelEtat, 'updated_at' => now()]
        );
        if (!$actif && $request->filled('message')) {
            \Illuminate\Support\Facades\DB::table('site_settings')->updateOrInsert(
                ['cle' => 'maintenance_message'],
                ['valeur' => $request->message, 'updated_at' => now()]
            );
        }

        \App\Services\ActivityLogger::log(
            $request->user(), $nouvelEtat === '1' ? 'system.maintenance_on' : 'system.maintenance_off',
            $nouvelEtat === '1' ? 'Mode maintenance activé — accès bloqué pour les autres rôles.' : 'Mode maintenance désactivé — accès rétabli.'
        );

        return response()->json(['maintenance' => $nouvelEtat === '1']);
    }

    // ── Vérification en deux étapes obligatoire ─────────────────────────────

    /** Un clic du super admin : à partir de maintenant, TOUT compte (quel que soit
     *  le rôle) qui se connecte doit vérifier un code envoyé par email avant
     *  d'obtenir son accès. S'applique à la prochaine connexion de chacun — les
     *  sessions déjà ouvertes ne sont pas coupées. */
    public function forceTwoFactor(Request $request)
    {
        $since = now()->toDateTimeString();

        \Illuminate\Support\Facades\DB::table('site_settings')->updateOrInsert(
            ['cle' => 'force_2fa_since'],
            ['valeur' => $since, 'updated_at' => now()]
        );

        \App\Services\ActivityLogger::log(
            $request->user(), 'system.force_2fa',
            'Vérification en deux étapes rendue obligatoire pour tous les comptes, dès leur prochaine connexion.'
        );

        return response()->json(['force_2fa_since' => $since]);
    }

    public function twoFactorStatus(Request $request)
    {
        $since = \Illuminate\Support\Facades\DB::table('site_settings')->where('cle', 'force_2fa_since')->value('valeur');

        $total     = \App\Models\User::count();
        $confirmes = $since
            ? \App\Models\User::where('two_factor_confirmed_at', '>=', $since)->count()
            : 0;

        return response()->json([
            'active'          => (bool) $since,
            'since'           => $since,
            'total_comptes'   => $total,
            'comptes_verifies'=> $confirmes,
        ]);
    }
}
