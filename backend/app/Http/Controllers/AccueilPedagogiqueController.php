<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Filiere;
use App\Models\License;
use App\Models\StudentNotification;
use App\Services\PDFService;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AccueilPedagogiqueController extends Controller
{
    public function __construct(
        private PDFService $pdfService,
        private QRCodeService $qrService,
    ) {}

    /** Liste des filières avec leurs niveaux et comptages d'étudiants */
    public function classes()
    {
        $filieres = Filiere::with(['licenses' => function ($q) {
            $q->withCount([
                'students as nb_inscrits' => fn ($q) =>
                    $q->whereIn('statut_inscription', ['accepte', 'en_attente_paiement', 'en_attente']),
            ]);
        }])->where('actif', true)->get();

        return response()->json($filieres);
    }

    /** Étudiants filtrés par filière / niveau */
    public function students(Request $request)
    {
        $query = Student::with(['filiere', 'license', 'card'])
            ->when($request->filiere_id, fn ($q) => $q->where('filiere_id', $request->filiere_id))
            ->when($request->license_id, fn ($q) => $q->where('license_id', $request->license_id))
            ->when($request->statut,     fn ($q) => $q->where('statut_inscription', $request->statut))
            ->when($request->search, fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom',        'like', '%' . $request->search . '%')
                   ->orWhere('prenom',   'like', '%' . $request->search . '%')
                   ->orWhere('matricule','like', '%' . $request->search . '%');
            }))
            ->latest();

        return response()->json($query->paginate(30));
    }

    /** Créer / inscrire un étudiant directement */
    public function addStudent(Request $request)
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
            'nationalite'    => 'nullable|string|max:100',
            'pays_residence' => 'nullable|string|max:100',
            'filiere_id'     => 'required|exists:filieres,id',
            'license_id'     => 'required|exists:licenses,id',
            'photo'          => 'nullable|image|max:3072',
            // Académique
            'annee_bac'             => 'nullable|string|max:20',
            'numero_pv_bac'         => 'nullable|string|max:50',
            'serie_college'         => 'nullable|string|max:50',
            'region_bac'            => 'nullable|string|max:100',
            'dernier_diplome'       => 'nullable|string|max:150',
            'annee_dernier_diplome' => 'nullable|string|max:20',
            'dernier_etablissement' => 'nullable|string|max:150',
            'numero_ine'            => 'nullable|string|max:50',
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
            'user_id'            => $user->id,
            'photo'              => $photoPath,
            'annee_scolaire'     => date('Y') . '-' . (date('Y') + 1),
            'statut_inscription' => 'accepte',
            'matricule'          => Student::generateMatricule(),
            'date_acceptation'   => now(),
            'accepte_par'        => $request->user()->id,
            'nationalite'        => $validated['nationalite'] ?? 'Sénégalais(e)',
            'pays_residence'     => $validated['pays_residence'] ?? 'Sénégal',
        ]));

        try {
            $this->qrService->generateStudentCard($student);
        } catch (\Exception $e) {
            \Log::error('Génération carte étudiant (pédagogique, addStudent) : ' . $e->getMessage());
        }

        try {
            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '✅ Inscription enregistrée',
                'message'    => 'Votre inscription a été enregistrée par le service pédagogique. Matricule : ' . $student->matricule,
                'type'       => 'success',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Notification inscription (pédagogique, addStudent) : ' . $e->getMessage());
        }

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->send(new \App\Mail\StudentInvite($user, $tempPassword, $student->fresh()));
        } catch (\Exception $e) {
            \Log::warning('Email invitation étudiant (pédagogique): ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Étudiant inscrit avec succès.',
            'student' => $student->fresh(['filiere', 'license', 'card']),
        ], 201);
    }

    /** Détail complet d'un étudiant */
    public function studentDetail(Student $student)
    {
        $student->load(['user', 'filiere', 'license', 'card',
            'payments' => fn ($q) => $q->where('statut', 'complete')->latest(),
        ]);

        return response()->json([
            'student'        => $student,
            'mois_non_payes' => $student->mois_non_payes,
            'a_jour'         => empty($student->mois_non_payes),
        ]);
    }

    /** Télécharger (ou visualiser) la liste d'une classe en PDF — présence ou notes */
    public function classListPdf(Request $request)
    {
        $request->validate([
            'filiere_id' => 'required|exists:filieres,id',
            'license_id' => 'nullable|exists:licenses,id',
            'type'       => 'nullable|in:presence,notes',
        ]);

        $students = Student::with(['filiere', 'license'])
            ->where('filiere_id', $request->filiere_id)
            ->when($request->license_id, fn ($q) => $q->where('license_id', $request->license_id))
            ->whereIn('statut_inscription', ['accepte', 'en_attente_paiement', 'en_attente'])
            ->orderBy('nom')
            ->get();

        $filiere = Filiere::findOrFail($request->filiere_id);
        $license = $request->license_id ? License::find($request->license_id) : null;
        $type    = $request->type === 'notes' ? 'notes' : 'presence';

        $path     = $this->pdfService->generateClassList($students, $filiere, $license, $type);
        $fullPath = Storage::disk('public')->path($path);
        $filename = 'liste_' . $type . '_' . ($filiere->code ?? 'classe') . '_' . now()->format('Ymd') . '.pdf';

        // Aperçu inline (avant téléchargement) si demandé, sinon téléchargement direct.
        if ($request->boolean('preview')) {
            return response()->file($fullPath, ['Content-Type' => 'application/pdf'])->deleteFileAfterSend(true);
        }

        return response()->download(
            $fullPath, $filename, ['Content-Type' => 'application/pdf']
        )->deleteFileAfterSend(true);
    }

    /** Générer la carte PDF d'un étudiant */
    public function generateCard(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }

        $this->qrService->generateStudentCard($student);
        $cardPath = $this->pdfService->generateStudentCard($student);

        return response()->json([
            'message'   => 'Carte générée avec succès.',
            'card_path' => $cardPath,
        ]);
    }

    /** Télécharger la carte PDF d'un étudiant */
    public function downloadCard(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }

        $cardPath = $this->pdfService->generateStudentCard($student);
        $fullPath = Storage::disk('public')->path($cardPath);

        return response()->download(
            $fullPath,
            'carte_' . $student->matricule . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger l'attestation de scolarité d'un étudiant */
    public function downloadAttestationScolarite(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }

        $path = $this->pdfService->generateAttestationScolarite($student);

        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_scolarite_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger l'attestation d'inscription d'un étudiant */
    public function downloadAttestationInscription(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }

        $path = $this->pdfService->generateAttestationInscription($student);

        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_inscription_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger la fiche d'inscription (contrat) d'un étudiant */
    public function downloadFicheInscription(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }

        $path = $this->pdfService->generateFicheInscription($student);

        return response()->download(
            Storage::disk('public')->path($path),
            'fiche_inscription_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger le certificat de scolarité (variante avec QR + case référence) */
    public function downloadCertificatScolarite(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $path = $this->pdfService->generateCertificatScolarite($student);
        return response()->download(
            Storage::disk('public')->path($path),
            'certificat_scolarite_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger l'attestation de formation (modules validés) */
    public function downloadAttestationFormation(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $path = $this->pdfService->generateAttestationFormation($student);
        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_formation_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Télécharger l'attestation de non soutenance (admissible à l'examen) */
    public function downloadAttestationNonSoutenance(Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $path = $this->pdfService->generateAttestationNonSoutenance($student);
        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_non_soutenance_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Télécharger l'attestation de réussite (fin de cycle).
     * Mention saisie manuellement — pas encore de module bulletin/notes en base.
     */
    public function downloadAttestationReussite(Request $request, Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateAttestationReussite($student, $validated['mention']);
        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_reussite_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Télécharger l'attestation d'encouragement.
     * Moyenne saisie manuellement — pas encore de module bulletin/notes en base.
     */
    public function downloadAttestationEncouragement(Request $request, Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $validated = $request->validate([
            'moyenne' => 'required|string|max:10',
            'periode' => 'required|string|max:50',
        ]);
        $path = $this->pdfService->generateAttestationEncouragement($student, $validated['moyenne'], $validated['periode']);
        return response()->download(
            Storage::disk('public')->path($path),
            'attestation_encouragement_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /**
     * Télécharger le diplôme de licence.
     * Mention saisie manuellement — pas encore de module bulletin/notes en base.
     */
    public function downloadDiplomeLicence(Request $request, Student $student)
    {
        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Inscription non encore acceptée.'], 422);
        }
        $validated = $request->validate(['mention' => 'required|string|max:50']);
        $path = $this->pdfService->generateDiplomeLicence($student, $validated['mention']);
        return response()->download(
            Storage::disk('public')->path($path),
            'diplome_licence_' . ($student->matricule ?? $student->id) . '.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    /** Basculer le verrouillage du profil */
    public function toggleLock(Request $request, Student $student)
    {
        $locked = !$student->profil_verrouille;

        $student->update([
            'profil_verrouille'     => $locked,
            'profil_verrouille_par' => $locked ? $request->user()->id : null,
            'profil_verrouille_le'  => $locked ? now() : null,
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => $locked ? '🔒 Dossier validé et verrouillé' : '🔓 Profil déverrouillé',
            'message'    => $locked
                ? 'Vos informations ont été vérifiées et validées par le service pédagogique. Dossier complet.'
                : 'Votre profil a été déverrouillé. Vous pouvez à nouveau modifier vos informations.',
            'type'       => $locked ? 'success' : 'info',
        ]);

        return response()->json([
            'message'           => $locked ? 'Profil verrouillé.' : 'Profil déverrouillé.',
            'profil_verrouille' => $locked,
        ]);
    }

    /** Mettre à jour la photo d'un étudiant */
    public function updatePhoto(Request $request, Student $student)
    {
        $request->validate(['photo' => 'required|image|max:3072']);

        if ($student->photo && Storage::disk('public')->exists($student->photo)) {
            Storage::disk('public')->delete($student->photo);
        }

        $photoPath = $request->file('photo')->store('photos', 'public');
        $student->update(['photo' => $photoPath]);

        return response()->json([
            'message'   => 'Photo mise à jour.',
            'photo_url' => asset('storage/' . $photoPath),
            'student'   => $student->fresh(['filiere', 'license', 'card']),
        ]);
    }

    /** Candidats en attente (pré-inscriptions) */
    public function pendingStudents(Request $request)
    {
        $students = Student::with(['filiere', 'license'])
            ->where('statut_inscription', 'en_attente')
            ->when($request->filiere_id, fn ($q) => $q->where('filiere_id', $request->filiere_id))
            ->latest()
            ->paginate(20);

        return response()->json($students);
    }

    /** Accepter une pré-inscription */
    public function acceptStudent(Request $request, Student $student)
    {
        if ($student->statut_inscription !== 'en_attente') {
            return response()->json(['message' => 'Dossier déjà traité.'], 422);
        }

        $matricule = Student::generateMatricule();
        $student->update([
            'statut_inscription' => 'en_attente_paiement',
            'date_acceptation'   => now(),
            'accepte_par'        => $request->user()->id,
            'matricule'          => $matricule,
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '🎉 Dossier accepté — Paiement requis',
            'message'    => "Votre dossier a été validé. Matricule provisoire : {$matricule}. Rendez-vous à la caisse pour finaliser.",
            'type'       => 'success',
        ]);

        return response()->json([
            'message' => 'Dossier accepté.',
            'student' => $student->fresh(['filiere', 'license']),
        ]);
    }
}
