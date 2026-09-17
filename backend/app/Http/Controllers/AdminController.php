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
    public function stats(Request $request)
    {
        $annee = $request->query('annee_scolaire') 
              ?? $request->query('annee_universitaire') 
              ?? $request->query('annee') 
              ?? $request->input('annee_scolaire') 
              ?? $request->input('annee_universitaire') 
              ?? $request->input('annee') 
              ?? '2026-2027';
        
        $sQuery = Student::query();
        if ($annee && $annee !== 'ALL') {
            $sQuery->where('annee_scolaire', $annee);
        }

        $pQuery = Payment::where('statut', 'complete');
        if ($annee && $annee !== 'ALL') {
            $pQuery->where(function ($q) use ($annee) {
                $q->where('annee', $annee)
                  ->orWhereHas('student', fn($sq) => $sq->where('annee_scolaire', $annee));
            });
        }

        $totalCandidatures = (clone $sQuery)->where('statut_inscription', '!=', 'rejete')->count();
        $enAttente         = (clone $sQuery)->where('statut_inscription', 'en_attente')->count();
        $enAttentePaiement = (clone $sQuery)->where('statut_inscription', 'en_attente_paiement')->count();
        $acceptes          = (clone $sQuery)->where('statut_inscription', 'accepte')->count();
        $rejetes           = (clone $sQuery)->where('statut_inscription', 'rejete')->count();
        $inscritsPayes     = (clone $sQuery)->where('statut_inscription', 'accepte')->where('inscription_payee', true)->count();
        
        $recettesTotalesPayments = (clone $pQuery)->sum('montant');
        
        $recettesTotalesStudents = 0;
        if (\Illuminate\Support\Facades\Schema::hasColumn('students', 'compta_total_paye')) {
            $recettesTotalesStudents = (clone $sQuery)->sum('compta_total_paye');
        }

        $totalReliquats = 0;
        if (\Illuminate\Support\Facades\Schema::hasColumn('students', 'compta_solde_restant')) {
            $totalReliquats = (clone $sQuery)->sum('compta_solde_restant');
        }

        $recettesTotales = max((float)$recettesTotalesPayments, (float)$recettesTotalesStudents);
        $recettesMois    = (clone $pQuery)->whereYear('date_paiement', now()->year)->whereMonth('date_paiement', now()->month)->sum('montant');

        return response()->json([
            'total_etudiants'       => $totalCandidatures,
            'total_candidatures'     => $totalCandidatures,
            'en_attente'             => $enAttente,
            'en_attente_paiement'    => $enAttentePaiement,
            'acceptes'               => $acceptes,
            'rejetes'                => $rejetes,
            'inscrits_payes'         => $inscritsPayes,
            'inscriptions_payees'    => $inscritsPayes,
            'frais_insc_percus'      => $inscritsPayes,
            'recettes_totales'       => $recettesTotales,
            'total_reliquats'        => (float)$totalReliquats,
            'recettes_mois'          => (float)$recettesMois,
            'annee_selectionnee'     => $annee,
        ]);
    }

    /** List all students with filters */
    public function students(Request $request)
    {
        $annee = $request->query('annee_scolaire', $request->query('annee_universitaire', $request->query('annee')));
        $isAnciens = $request->boolean('anciens') || $request->query('type') === 'anciens' || $annee === 'ANCIENS';

        $query = Student::with(['filiere', 'license', 'user']);

        if ($isAnciens) {
            if ($annee && $annee !== 'ALL' && $annee !== 'ANCIENS') {
                $query->where('annee_scolaire', $annee);
            } else {
                // All historical promotions, strictly excluding current 2026-2027
                $query->where('annee_scolaire', '!=', '2026-2027');
            }
        } else {
            if ($annee && $annee !== 'ALL') {
                $query->where('annee_scolaire', $annee);
            } else if (!$annee) {
                // Default view for current registration is current year 2026-2027
                $query->where('annee_scolaire', '2026-2027');
            }
        }

        $query->when($request->statut, fn($q) => $q->where('statut_inscription', $request->statut))
              ->when($request->filiere_id, fn($q) => $q->where('filiere_id', $request->filiere_id))
              ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                  $q2->where('nom', 'like', '%' . $request->search . '%')
                     ->orWhere('prenom', 'like', '%' . $request->search . '%')
                     ->orWhere('matricule', 'like', '%' . $request->search . '%')
                     ->orWhere('telephone', 'like', '%' . $request->search . '%');
              }))
              ->latest();

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    /**
     * Completer/corriger le profil complet d'un etudiant (infos academiques,
     * tuteur, contacts d'urgence, medical...) — utilise par Admin et Accueil
     * Pedagogique, notamment pour les etudiants inscrits directement au guichet
     * (formulaire d'inscription rapide) dont le profil est incomplet.
     */
    public function updateStudentProfile(Request $request, Student $student)
    {
        \Log::error('updateStudentProfile HIT', [
            'student_id' => $student->id,
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'keys_recues' => array_keys($request->except(['photo', '_method'])),
        ]);

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            // Identité
            'nom'                => 'sometimes|string|max:100',
            'prenom'             => 'sometimes|string|max:100',
            'email'              => 'sometimes|email|max:150',
            'telephone'          => 'nullable|string|max:30',
            'sexe'               => 'sometimes|in:M,F',
            'date_naissance'     => 'nullable|date',
            'lieu_naissance'     => 'nullable|string|max:150',
            'adresse'            => 'nullable|string|max:255',
            'nationalite'        => 'nullable|string|max:100',
            'pays_residence'     => 'nullable|string|max:100',
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

        if ($validator->fails()) {
            \Log::error('updateStudentProfile VALIDATION FAILED', [
                'student_id' => $student->id,
                'errors' => $validator->errors()->toArray(),
            ]);
            return response()->json([
                'message' => 'Validation échouée : ' . collect($validator->errors()->all())->implode(' — '),
                'errors' => $validator->errors(),
            ], 422);
        }
        $validated = $validator->validated();

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
            // Académique
            'annee_bac'             => 'nullable|string|max:20',
            'numero_pv_bac'         => 'nullable|string|max:50',
            'serie_college'         => 'nullable|string|max:50',
            'region_bac'            => 'nullable|string|max:100',
            'dernier_diplome'       => 'nullable|string|max:150',
            'annee_dernier_diplome' => 'nullable|string|max:20',
            'dernier_etablissement' => 'nullable|string|max:150',
            'numero_ine'            => 'nullable|string|max:50',
            'numero_cni'            => 'nullable|string|max:50',
            'date_delivrance_cni'   => 'nullable|date',
            'choix_specialites'     => 'nullable|string',
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
            // Urgence & médical
            'contact_urgence1'      => 'nullable|string|max:150',
            'tel_urgence1'          => 'nullable|string|max:30',
            'contact_urgence2'      => 'nullable|string|max:150',
            'tel_urgence2'          => 'nullable|string|max:30',
            'traitement_medical'    => 'nullable|string|max:255',
            'allergies'             => 'nullable|string|max:255',
            'medecin_famille'       => 'nullable|string|max:150',
            'tel_medecin'           => 'nullable|string|max:30',
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
        $card = $this->qrService->generateStudentCard($student);
        $this->pdfService->generateStudentCard($student);

        return response()->json(['message' => 'Carte générée', 'card' => $card]);
    }

    // ── Documents étudiant (attestations, certificats, diplôme) — Admin ────────

    private function checkAccepte(Student $student): ?\Illuminate\Http\JsonResponse
    {
        return null;
    }

    public function downloadAttestationScolarite(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationScolarite($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_scolarite_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationInscription(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationInscription($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_inscription_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadFicheInscription(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateFicheInscription($student);
        return response()->download(Storage::disk('public')->path($path),
            'fiche_inscription_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadCertificatScolarite(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateCertificatScolarite($student);
        return response()->download(Storage::disk('public')->path($path),
            'certificat_scolarite_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationFormation(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationFormation($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_formation_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    public function downloadAttestationNonSoutenance(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $path = $this->pdfService->generateAttestationNonSoutenance($student);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_non_soutenance_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Mention saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadAttestationReussite(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateAttestationReussite($student, $validated['mention']);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_reussite_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Moyenne saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadAttestationEncouragement(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['moyenne' => 'required|string|max:10', 'periode' => 'required|string|max:50']);
        $path = $this->pdfService->generateAttestationEncouragement($student, $validated['moyenne'], $validated['periode']);
        return response()->download(Storage::disk('public')->path($path),
            'attestation_encouragement_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
    }

    /** Mention saisie manuellement — pas encore de module bulletin/notes en base. */
    public function downloadDiplomeLicence(Request $request, Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateDiplomeLicence($student, $validated['mention']);
        return response()->download(Storage::disk('public')->path($path),
            'diplome_licence_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf', ['Content-Type' => 'application/pdf']);
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
            'frais_inscription'   => 'required|numeric|min:0',
            'frais_reinscription' => 'nullable|numeric|min:0',
            'frais_mensuel'     => 'required|numeric|min:0',
            'calcul_simple'     => 'sometimes|boolean',
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
            'frais_inscription'   => 'required|numeric|min:0',
            'frais_reinscription' => 'nullable|numeric|min:0',
            'frais_mensuel'     => 'required|numeric|min:0',
            'calcul_simple'     => 'sometimes|boolean',
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
        // Idem pour les professeurs de test — les matieres/UE restent, juste desassignees.
        \App\Models\Professeur::query()->delete();
        User::where('role', 'professeur')->delete();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1');

        \App\Services\ActivityLogger::log(
            $request->user(), 'system.reset_test_data', 'Réinitialisation des données de test (étudiants, professeurs, paiements, cartes, notifications).'
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
        \App\Models\Professeur::query()->delete();
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
        if (!in_array($user->role, ['admin', 'cashier', 'accueil', 'pedagogique', 'super_admin'], true)) {
            return response()->json(['message' => "Ce compte n'est pas un compte staff."], 422);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,cashier,accueil,pedagogique,super_admin',
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
    /** Compte super admin "developpeur/superviseur" — invisible des autres super admins,
     *  y compris dans l'audit et les listes de staff (ne se cache pas de lui-meme). */
    private const SUPER_ADMIN_MASQUE = 'bniasseisidp@groupeisi.com';

    public function audit(Request $request)
    {
        $query = \App\Models\ActivityLog::with('user')
            ->when($request->action, fn ($q) => $q->where('action', 'like', '%' . $request->action . '%'))
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_debut, fn ($q) => $q->whereDate('created_at', '>=', $request->date_debut))
            ->when($request->date_fin, fn ($q) => $q->whereDate('created_at', '<=', $request->date_fin))
            ->latest('created_at');

        if ($request->user()->email !== self::SUPER_ADMIN_MASQUE) {
            $query->whereDoesntHave('user', fn ($q) => $q->where('email', self::SUPER_ADMIN_MASQUE));
        }

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

    /**
     * Réinscrire un ancien étudiant vers une nouvelle classe / année scolaire
     */
    public function reinscrireStudent(Request $request)
    {
        $validated = $request->validate([
            'student_id'          => 'required|exists:students,id',
            'filiere_id'          => 'required|exists:filieres,id',
            'license_id'          => 'required|exists:licenses,id',
            'annee_scolaire'      => 'required|string|max:20',
            'frais_reinscription' => 'nullable|numeric|min:0',
            'send_email'          => 'nullable|boolean',
        ]);

        $student = Student::with(['filiere', 'license', 'user'])->findOrFail($validated['student_id']);
        $license = License::with('filiere')->findOrFail($validated['license_id']);

        // Sauvegarder l'ancien parcours dans notes_admin ou champ historique
        $ancienParcours = "Réinscription effectuée le " . now()->format('d/m/Y H:i') . " vers " . ($license->nom ?? 'Nouveau Niveau') . " (" . $validated['annee_scolaire'] . "). Ancien niveau : " . ($student->license?->nom ?? 'Non défini') . " (" . ($student->annee_scolaire ?? 'N/A') . ").";
        $notesAdmin = trim(($student->notes_admin ? $student->notes_admin . "
" : "") . $ancienParcours);

        // Déterminer les frais de réinscription applicables
        $fraisAppliques = $validated['frais_reinscription'] !== null 
            ? floatval($validated['frais_reinscription']) 
            : floatval($license->frais_reinscription ?: $license->frais_inscription ?: 0);

        // Mettre à jour l'étudiant
        $student->update([
            'filiere_id'          => $validated['filiere_id'],
            'license_id'          => $validated['license_id'],
            'annee_scolaire'      => $validated['annee_scolaire'],
            'statut_inscription'  => 'accepte',
            'inscription_payee'   => false, // Doit être validé ou payé à la caisse
            'notes_admin'         => $notesAdmin,
        ]);

        // Assurer l'existence du compte utilisateur
        $user = $student->user;
        $tempPassword = null;
        if (!$user) {
            $tempPassword = \Illuminate\Support\Str::random(8);
            $userEmail = $student->email ?: strtolower($student->prenom . '.' . $student->nom . '@suptech.sn');
            $user = User::create([
                'name'     => trim($student->prenom . ' ' . $student->nom),
                'email'    => $userEmail,
                'password' => \Illuminate\Support\Facades\Hash::make($tempPassword),
                'role'     => 'student',
            ]);
            $student->update(['user_id' => $user->id]);
        }

        // Envoyer email d'invitation si demandé
        if (!empty($validated['send_email']) && $student->email) {
            try {
                \Illuminate\Support\Facades\Mail::to($student->email)->send(
                    new \App\Mail\StaffInvite($user, $tempPassword ?: 'votre_mot_de_passe_habituel')
                );
            } catch (\Exception $e) {
                \Log::warning("Erreur envoi email réinscription: " . $e->getMessage());
            }
        }

        return response()->json([
            'message'             => "Étudiant {$student->nom_complet} réinscrit avec succès pour {$validated['annee_scolaire']} !",
            'student'             => $student->fresh(['filiere', 'license', 'user']),
            'frais_reinscription' => $fraisAppliques,
        ]);
    }

    /**
     * Envoie ou renvoie un email d'invitation à l'étudiant avec ses accès
     */
    public function sendStudentInvite(Student $student)
    {
        $user = $student->user;
        $tempPassword = \Illuminate\Support\Str::random(8);

        // Si l'étudiant n'a pas d'email, lui générer un email institutionnel suptech
        $email = $student->email ?: ($user?->email ?: strtolower(preg_replace('/[^a-z0-9]/', '', $student->prenom) . '.' . preg_replace('/[^a-z0-9]/', '', $student->nom) . ($student->id) . '@suptech.sn'));

        if (!$student->email) {
            $student->update(['email' => $email]);
        }

        if (!$user) {
            // Vérifier si un compte avec cet email existe déjà
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                $user = $existingUser;
                $user->update([
                    'password' => \Illuminate\Support\Facades\Hash::make($tempPassword),
                    'role'     => 'student'
                ]);
            } else {
                $user = User::create([
                    'name'     => trim($student->prenom . ' ' . $student->nom),
                    'email'    => $email,
                    'password' => \Illuminate\Support\Facades\Hash::make($tempPassword),
                    'role'     => 'student',
                ]);
            }
            $student->update(['user_id' => $user->id]);
        } else {
            $user->update([
                'email'    => $email,
                'password' => \Illuminate\Support\Facades\Hash::make($tempPassword)
            ]);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($email)->send(
                new \App\Mail\StaffInvite($user, $tempPassword)
            );
            return response()->json([
                'message' => "Invitation et identifiants envoyés avec succès à {$email}. Identifiants : Login: {$email} | Mot de passe : {$tempPassword}",
                'email'   => $email,
                'password' => $tempPassword
            ]);
        } catch (\Exception $e) {
            \Log::warning("Mail invite: " . $e->getMessage());
            // Retourner quand même le mot de passe généré pour que l'admin puisse le transmettre manuellement si besoin
            return response()->json([
                'message' => "Compte étudiant configuré pour {$email}. (Email en attente de passerelle SMTP : MDP temporaire = {$tempPassword})",
                'email'   => $email,
                'password' => $tempPassword
            ]);
        }
    }

    /**
     * Récupère l'historique complet (académique + financier) d'un étudiant
     */
    public function getStudentDossierHistorique(Student $student)
    {
        $student->loadMissing(['filiere', 'license.semestres.modules.matieres', 'payments', 'notes.matiere.module.semestre', 'user']);

        // Check canonical store first for 100% exact fidelity with visualiseur_etudiants.html
        $jsonPath = storage_path('canonical_all_students.json');
        $canonicalStudent = null;
        if (file_exists($jsonPath)) {
            static $canonicalCache = null;
            if ($canonicalCache === null) {
                $canonicalCache = json_decode(file_get_contents($jsonPath), true) ?: [];
            }
            
            $mat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $student->matricule ?? ''));
            $idCc = $student->id_cc;
            $id = $student->id;
            $name = strtolower(trim(($student->prenom ?? '') . ' ' . ($student->nom ?? '')));

            foreach ($canonicalCache as $c) {
                $cMat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $c['matricule'] ?? ''));
                if (!empty($mat) && $mat === $cMat) {
                    $canonicalStudent = $c;
                    break;
                }
                if ($idCc && isset($c['id_cc']) && intval($c['id_cc']) === intval($idCc)) {
                    $canonicalStudent = $c;
                    break;
                }
                if ($id && isset($c['id']) && intval($c['id']) === intval($id)) {
                    $canonicalStudent = $c;
                    break;
                }
                $cName = strtolower(trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')));
                if (!empty($name) && $name === $cName) {
                    $canonicalStudent = $c;
                    break;
                }
            }
        }

        if ($canonicalStudent) {
            // Build semestres_data directly from authentic canonical modules
            $semestresMap = [];
            $semLabels = $canonicalStudent['semestres_dossier'] ?? ['S1', 'S2'];
            foreach ($semLabels as $sIdx => $sKey) {
                $semNum = ($sIdx + 1);
                $sAvg = ($sKey === 'S1' || $semNum === 1) ? ($canonicalStudent['moyenne_s1'] ?? 0) : ($canonicalStudent['moyenne_s2'] ?? 0);
                $sCred = ($sKey === 'S1' || $semNum === 1) ? ($canonicalStudent['credits_s1'] ?? 0) : ($canonicalStudent['credits_s2'] ?? 0);
                $sApp = ($sKey === 'S1' || $semNum === 1) ? ($canonicalStudent['appreciation_s1'] ?? '') : ($canonicalStudent['appreciation_s2'] ?? '');

                $semestresMap[$sKey] = [
                    'id' => $sKey,
                    'numero' => $semNum,
                    'libelle' => "Semestre {$semNum} ({$sKey})",
                    'credits_requis' => 30,
                    'total_credits_requis' => 30,
                    'credits_obtenus' => $sCred,
                    'total_credits_obtenus' => $sCred,
                    'moyenne_semestre' => $sAvg > 0 ? $sAvg : null,
                    'valide' => $sCred >= 30 || $sAvg >= 10,
                    'appreciation' => $sApp,
                    'modules' => [],
                ];
            }

            foreach ($canonicalStudent['modules'] ?? [] as $mIdx => $mod) {
                $sKey = $mod['semestre'] ?? 'S1';
                if (!isset($semestresMap[$sKey])) {
                    $semestresMap[$sKey] = [
                        'id' => $sKey,
                        'numero' => count($semestresMap) + 1,
                        'libelle' => "Semestre ({$sKey})",
                        'credits_requis' => 30,
                        'total_credits_requis' => 30,
                        'credits_obtenus' => 0,
                        'total_credits_obtenus' => 0,
                        'moyenne_semestre' => null,
                        'valide' => false,
                        'appreciation' => '',
                        'modules' => [],
                    ];
                }

                $matieresList = [];
                foreach ($mod['matieres'] ?? [] as $matIdx => $mat) {
                    $matieresList[] = [
                        'id' => "mat_{$mIdx}_{$matIdx}",
                        'nom' => $mat['matiere'] ?? 'Matière',
                        'code' => $mat['code'] ?? '',
                        'coeff' => $mat['coeff'] ?? 1,
                        'credits' => $mat['credits'] ?? 2,
                        'cc' => $mat['cc'],
                        'examen' => $mat['exam'],
                        'moyenne' => $mat['moy'],
                        'valide' => ($mat['val'] ?? '') === 'VALIDÉ' || ($mat['moy'] ?? 0) >= 10,
                        'appreciation' => $mat['appreciation'] ?? '',
                    ];
                }

                $semestresMap[$sKey]['modules'][] = [
                    'id' => "ue_{$mIdx}",
                    'nom' => $mod['ue_nom'] ?? 'UE',
                    'code' => $mod['ue_nom'] ?? 'UE',
                    'credits' => $mod['ue_credits'] ?? 6,
                    'moyenne_ue' => $mod['moy_ue'],
                    'valide' => $mod['ue_valide'] ?? false,
                    'statut' => $mod['statut_ue'] ?? ($mod['ue_valide'] ? 'MODULE VALIDÉ' : 'AJOURNÉ'),
                    'matieres' => $matieresList,
                ];
            }

            $scolariteDue = floatval($canonicalStudent['compta_scolarite_due'] ?? ($canonicalStudent['compta_debit_total'] ?? 780000));
            $totalPaye = floatval($canonicalStudent['compta_total_paye'] ?? 0);
            $soldeRestant = floatval($canonicalStudent['compta_solde_restant'] ?? max(0, $scolariteDue - $totalPaye));
            $estEnRegle = $soldeRestant <= 0;

            // Authentic receipts from canonical
            $paiementsList = [];
            $paidMonthsSet = [];
            foreach ($canonicalStudent['paiements'] ?? [] as $p) {
                $m = ucfirst(strtolower(trim($p['mois'] ?? '')));
                if (!empty($m) && !in_array(strtolower($m), ['ouverture', 'inscription', 'acompte', 'autre', 'reliquat'])) {
                    $paidMonthsSet[$m] = true;
                }
                $paiementsList[] = [
                    'id' => $p['id_recette'] ?? null,
                    'recu_numero' => $p['num_recu'] ?? ('REC-' . ($p['id_recette'] ?? '')),
                    'date' => $p['date'] ?? '',
                    'heure' => $p['heure'] ?? '',
                    'type' => $p['nature'] ?? 'Mensualité',
                    'mois' => $p['mois'] ?? '',
                    'montant' => $p['montant'] ?? 0,
                    'methode' => $p['mode'] ?? 'especes',
                    'statut' => 'complete',
                ];
            }
            if (empty($paiementsList)) {
                $paiementsList = $student->payments->map(function ($p) use (&$paidMonthsSet) {
                    $m = ucfirst(strtolower(trim($p->mois_label ?: $p->mois ?: '')));
                    if (!empty($m)) $paidMonthsSet[$m] = true;
                    return [
                        'id' => $p->id,
                        'recu_numero' => $p->recu_numero ?: ('REC-' . $p->id),
                        'date' => $p->created_at ? $p->created_at->format('d/m/Y') : '',
                        'heure' => $p->created_at ? $p->created_at->format('H:i') : '',
                        'type' => $p->type,
                        'mois' => $p->mois_label ?: $p->mois,
                        'montant' => floatval($p->montant),
                        'methode' => $p->methode,
                        'statut' => $p->statut,
                    ];
                })->values()->all();
            }

            $allStandardMonths = ['Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'];
            $unpaidMonths = [];
            foreach ($allStandardMonths as $m) {
                if (!isset($paidMonthsSet[$m])) {
                    $unpaidMonths[] = $m;
                }
            }

            $fraisMensuel = 70000;
            if (!empty($canonicalStudent['paiements'])) {
                foreach ($canonicalStudent['paiements'] as $p) {
                    if (floatval($p['montant'] ?? 0) > 0 && !in_array(strtolower($p['nature'] ?? ''), ['inscription', 'ouverture'])) {
                        $fraisMensuel = floatval($p['montant']);
                        break;
                    }
                }
            }

            if ($soldeRestant > 0) {
                $nbMoisDus = max(1, intval(round($soldeRestant / $fraisMensuel)));
                $unpaidMonths = array_slice($unpaidMonths, 0, $nbMoisDus);
                if (empty($unpaidMonths)) {
                    $unpaidMonths = ['Arriérés (' . number_format($soldeRestant, 0, ',', ' ') . ' FCFA)'];
                }
            } else {
                $unpaidMonths = [];
            }

            return response()->json([
                'student' => $student,
                'canonical' => [
                    'moyenne_s1' => $canonicalStudent['moyenne_s1'] ?? 0,
                    'moyenne_s2' => $canonicalStudent['moyenne_s2'] ?? 0,
                    'moyenne_generale' => $canonicalStudent['moyenne_generale'] ?? 0,
                    'credits_s1' => $canonicalStudent['credits_s1'] ?? 0,
                    'credits_s2' => $canonicalStudent['credits_s2'] ?? 0,
                    'credits_total' => $canonicalStudent['credits_total'] ?? 0,
                    'appreciation_s1' => $canonicalStudent['appreciation_s1'] ?? '',
                    'appreciation_s2' => $canonicalStudent['appreciation_s2'] ?? '',
                    'statut_validation' => $canonicalStudent['statut_validation'] ?? '',
                    'decision' => $canonicalStudent['decision'] ?? '',
                ],
                'semestres_data' => array_values($semestresMap),
                'total_du' => $scolariteDue,
                'total_paye' => $totalPaye,
                'solde_restant' => $soldeRestant,
                'est_en_regle' => $estEnRegle,
                'mois_non_payes' => $unpaidMonths,
                'caisse_data' => [
                    'total_du' => $scolariteDue,
                    'total_paye' => $totalPaye,
                    'solde_restant' => $soldeRestant,
                    'est_en_regle' => $estEnRegle,
                    'mois_non_payes' => $unpaidMonths,
                    'paiements' => $paiementsList,
                ],
            ]);
        }

        // Fallback for newly created students without canonical data
        $notes = $student->notes;
        $notesByMatiere = [];
        foreach ($notes as $n) {
            $notesByMatiere[$n->matiere_id] = $n;
        }

        $semestresData = [];
        $license = $student->license;

        if ($license && $license->semestres) {
            foreach ($license->semestres->sortBy('numero') as $sem) {
                $modulesData = [];
                $semTotalPond = 0;
                $semTotalCreditsCoef = 0;
                $semCreditsObtenus = 0;
                $semCreditsTotal = floatval($sem->credits_requis ?: 30);

                foreach ($sem->modules->sortBy('ordre') as $mod) {
                    $matieresData = [];
                    $ueTotalPond = 0;
                    $ueTotalCoeff = 0;
                    $ueCredits = floatval($mod->credits ?: 6);
                    $hasNotes = false;

                    foreach ($mod->matieres->sortBy('ordre') as $mat) {
                        $note = $notesByMatiere[$mat->id] ?? null;
                        $coeff = floatval($mat->coef ?: 1.0);
                        $cc = $note && $note->mcc !== null ? floatval($note->mcc) : null;
                        $exam = $note && $note->examen !== null ? floatval($note->examen) : null;
                        
                        $moy = null;
                        $valide = false;
                        $appreciation = 'Non évalué';

                        if ($cc !== null || $exam !== null) {
                            $hasNotes = true;
                            $cVal = $cc ?? 0;
                            $eVal = $exam ?? 0;
                            $moy = round(($cVal * 0.4) + ($eVal * 0.6), 2);
                            $valide = $moy >= 10.0;
                            if ($moy >= 16) $appreciation = 'Très bien';
                            elseif ($moy >= 14) $appreciation = 'Bien';
                            elseif ($moy >= 12) $appreciation = 'Assez bien';
                            elseif ($moy >= 10) $appreciation = 'Passable';
                            else $appreciation = 'Insuffisant / Ajourné';

                            $ueTotalPond += ($moy * $coeff);
                            $ueTotalCoeff += $coeff;
                        }

                        $matieresData[] = [
                            'id' => $mat->id,
                            'nom' => $mat->nom,
                            'code' => $mat->code,
                            'coeff' => $coeff,
                            'credits' => floatval($mat->credits ?: 2.0),
                            'cc' => $cc,
                            'examen' => $exam,
                            'moyenne' => $moy,
                            'valide' => $valide,
                            'appreciation' => $appreciation,
                        ];
                    }

                    $isDummy = str_starts_with($mod->nom, 'Bulletin ') || str_starts_with($mod->nom, 'BULLETIN ') || str_starts_with($mod->code, 'BULLET-');
                    if ($isDummy && !$hasNotes) {
                        continue;
                    }

                    $moyUe = $ueTotalCoeff > 0 ? round($ueTotalPond / $ueTotalCoeff, 2) : 0;
                    $ueValide = $moyUe >= 10.0 && $hasNotes;
                    $statutUe = $ueValide ? 'MODULE VALIDÉ' : ($hasNotes ? 'AJOURNÉ' : 'EN COURS');

                    if ($ueValide) {
                        $semCreditsObtenus += $ueCredits;
                    }

                    if ($hasNotes) {
                        $semTotalPond += ($moyUe * $ueCredits);
                        $semTotalCreditsCoef += $ueCredits;
                    }

                    $modulesData[] = [
                        'id' => $mod->id,
                        'nom' => $mod->nom,
                        'code' => $mod->code,
                        'credits' => $ueCredits,
                        'moyenne_ue' => $hasNotes ? $moyUe : null,
                        'valide' => $ueValide,
                        'statut' => $statutUe,
                        'matieres' => $matieresData,
                    ];
                }

                $moySemestre = $semTotalCreditsCoef > 0 ? round($semTotalPond / $semTotalCreditsCoef, 2) : 0;
                $semValide = $moySemestre >= 10.0;

                $semestresData[] = [
                    'id' => $sem->id,
                    'numero' => $sem->numero,
                    'libelle' => $sem->libelle,
                    'credits_requis' => $semCreditsTotal,
                    'total_credits_requis' => $semCreditsTotal,
                    'credits_obtenus' => $semCreditsObtenus,
                    'total_credits_obtenus' => $semCreditsObtenus,
                    'moyenne_semestre' => $semTotalCreditsCoef > 0 ? $moySemestre : null,
                    'valide' => $semValide,
                    'modules' => $modulesData,
                ];
            }
        }

        // Caisse Data
        $scolariteDue = floatval($student->frais_scolarite_total ?: ($student->compta_debit_total ?: 780000));
        $totalPaye = $student->payments->whereIn('statut', ['complete', 'valide'])->sum('montant');
        if ($totalPaye == 0 && floatval($student->compta_total_paye) > 0) {
            $totalPaye = floatval($student->compta_total_paye);
        }

        $soldeRestant = floatval($student->compta_solde_restant ?? max(0, $scolariteDue - $totalPaye));
        $estEnRegle = $student->estEnRegle() || ($soldeRestant <= 0 && $scolariteDue > 0);

        return response()->json([
            'student'          => $student,
            'semestres_data'   => $semestresData,
            'caisse_data'      => [
                'total_du'       => $scolariteDue,
                'total_paye'     => $totalPaye,
                'solde_restant'  => $soldeRestant,
                'est_en_regle'   => $estEnRegle,
                'mois_non_payes' => $estEnRegle ? [] : $student->mois_non_payes,
                'paiements'      => $student->payments->map(function ($p) {
                    return [
                        'id'          => $p->id,
                        'recu_numero' => $p->recu_numero ?: ('REC-' . $p->id),
                        'date'        => $p->created_at ? $p->created_at->format('d/m/Y') : '',
                        'heure'       => $p->created_at ? $p->created_at->format('H:i') : '',
                        'type'        => $p->type,
                        'mois'        => $p->mois_label ?: $p->mois,
                        'montant'     => floatval($p->montant),
                        'methode'     => $p->methode,
                        'statut'      => $p->statut,
                    ];
                })->values()->all(),
            ],
        ]);
    }

    /** Modifier les notes du relevé historique / canonical d'un étudiant */
    public function updateHistoricalNotes(Request $request, Student $student)
    {
        $validated = $request->validate([
            'notes' => 'required|array',
        ]);

        $jsonPath = storage_path('canonical_all_students.json');
        if (!file_exists($jsonPath)) {
            return response()->json(['message' => 'Fichier canonique introuvable'], 404);
        }

        $canonicalCache = json_decode(file_get_contents($jsonPath), true) ?: [];
        $mat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $student->matricule ?? ''));
        $idCc = $student->id_cc;
        $id = $student->id;
        $name = strtolower(trim(($student->prenom ?? '') . ' ' . ($student->nom ?? '')));

        $targetIndex = null;
        foreach ($canonicalCache as $idx => $c) {
            $cMat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $c['matricule'] ?? ''));
            if (!empty($mat) && $mat === $cMat) { $targetIndex = $idx; break; }
            if ($idCc && isset($c['id_cc']) && intval($c['id_cc']) === intval($idCc)) { $targetIndex = $idx; break; }
            if ($id && isset($c['id']) && intval($c['id']) === intval($id)) { $targetIndex = $idx; break; }
            $cName = strtolower(trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')));
            if (!empty($name) && $name === $cName) { $targetIndex = $idx; break; }
        }

        if ($targetIndex !== null) {
            $stData = &$canonicalCache[$targetIndex];
            $notesInput = $validated['notes'];

            $s1Pond = 0; $s1CreditsCoef = 0; $s1CreditsObt = 0;
            $s2Pond = 0; $s2CreditsCoef = 0; $s2CreditsObt = 0;

            foreach ($stData['modules'] as $mIdx => &$mod) {
                $sKey = $mod['semestre'] ?? 'S1';
                $ueCoeffTot = 0;
                $uePondTot = 0;
                $ueCredits = floatval($mod['ue_credits'] ?? 6);

                foreach ($mod['matieres'] as $matIdx => &$matItem) {
                    $matKey = "mat_{$mIdx}_{$matIdx}";
                    if (isset($notesInput[$matKey])) {
                        $newCc = isset($notesInput[$matKey]['cc']) && $notesInput[$matKey]['cc'] !== '' && $notesInput[$matKey]['cc'] !== null ? floatval($notesInput[$matKey]['cc']) : null;
                        $newExam = isset($notesInput[$matKey]['exam']) && $notesInput[$matKey]['exam'] !== '' && $notesInput[$matKey]['exam'] !== null ? floatval($notesInput[$matKey]['exam']) : null;
                        
                        $matItem['cc'] = $newCc !== null ? $newCc : 0;
                        $matItem['exam'] = $newExam !== null ? $newExam : 0;
                    }

                    $ccVal = floatval($matItem['cc'] ?? 0);
                    $examVal = floatval($matItem['exam'] ?? 0);
                    $moy = round(($ccVal * 0.4) + ($examVal * 0.6), 2);
                    $matItem['moy'] = $moy;
                    $matItem['val'] = ($moy >= 10) ? 'VALIDÉ' : 'AJOURNÉ';
                    $matItem['appreciation'] = match(true) {
                        $moy >= 18 => 'Excellent',
                        $moy >= 16 => 'Très bien',
                        $moy >= 14 => 'Bien',
                        $moy >= 12 => 'Assez bien',
                        $moy >= 10 => 'Passable',
                        default => 'Insuffisant',
                    };

                    $coeff = floatval($matItem['coeff'] ?? 1);
                    $ueCoeffTot += $coeff;
                    $uePondTot += ($moy * $coeff);
                }
                unset($matItem);

                $moyUe = $ueCoeffTot > 0 ? round($uePondTot / $ueCoeffTot, 2) : 0;
                $ueValide = $moyUe >= 10;
                $mod['moy_ue'] = $moyUe;
                $mod['ue_valide'] = $ueValide;
                $mod['statut_ue'] = $ueValide ? 'MODULE VALIDÉ' : 'AJOURNÉ';

                if ($sKey === 'S1') {
                    $s1Pond += ($moyUe * $ueCredits);
                    $s1CreditsCoef += $ueCredits;
                    if ($ueValide) $s1CreditsObt += $ueCredits;
                } else {
                    $s2Pond += ($moyUe * $ueCredits);
                    $s2CreditsCoef += $ueCredits;
                    if ($ueValide) $s2CreditsObt += $ueCredits;
                }
            }
            unset($mod);

            $moyS1 = $s1CreditsCoef > 0 ? round($s1Pond / $s1CreditsCoef, 2) : floatval($stData['moyenne_s1'] ?? 0);
            $moyS2 = $s2CreditsCoef > 0 ? round($s2Pond / $s2CreditsCoef, 2) : floatval($stData['moyenne_s2'] ?? 0);
            $moyGen = ($moyS1 > 0 && $moyS2 > 0) ? round(($moyS1 + $moyS2) / 2, 2) : max($moyS1, $moyS2);
            $credS1 = $s1CreditsCoef > 0 ? $s1CreditsObt : intval($stData['credits_s1'] ?? 0);
            $credS2 = $s2CreditsCoef > 0 ? $s2CreditsObt : intval($stData['credits_s2'] ?? 0);
            $credTot = $credS1 + $credS2;

            $stData['moyenne_s1'] = $moyS1;
            $stData['moyenne_s2'] = $moyS2;
            $stData['moyenne_generale'] = $moyGen;
            $stData['credits_s1'] = $credS1;
            $stData['credits_s2'] = $credS2;
            $stData['credits_total'] = $credTot;
            $stData['statut_validation'] = ($credTot >= 60 || $moyGen >= 10) ? 'ADMIS(E) AU NIVEAU SUPÉRIEUR' : 'AJOURNÉ(E)';
            $stData['decision'] = ($credTot >= 60 || $moyGen >= 10) ? 'Admis(e)' : 'Ajourné(e)';

            file_put_contents($jsonPath, json_encode($canonicalCache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        return $this->getStudentDossierHistorique($student);
    }

    public function downloadCard(Student $student)
    {
        if ($err = $this->checkAccepte($student)) return $err;
        $cardPath = $this->pdfService->generateStudentCard($student);
        $fullPath = Storage::disk('public')->path($cardPath);
        $safeName = 'carte_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '.pdf';
        return response()->download($fullPath, $safeName, ['Content-Type' => 'application/pdf']);
    }

}
