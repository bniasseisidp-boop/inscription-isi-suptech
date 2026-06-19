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
        ]);

        $photoPath = $request->hasFile('photo')
            ? $request->file('photo')->store('photos', 'public')
            : null;

        $user = User::create([
            'name'     => $validated['prenom'] . ' ' . $validated['nom'],
            'email'    => $validated['email'],
            'password' => Hash::make(\Str::random(12)),
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

        $this->qrService->generateStudentCard($student);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '✅ Inscription enregistrée',
            'message'    => 'Votre inscription a été enregistrée par le service pédagogique. Matricule : ' . $student->matricule,
            'type'       => 'success',
        ]);

        return response()->json([
            'message' => 'Étudiant inscrit avec succès.',
            'student' => $student->fresh(['filiere', 'license', 'card']),
        ], 201);
    }

    /** Détail complet d'un étudiant */
    public function studentDetail(Student $student)
    {
        $student->load(['filiere', 'license', 'card',
            'payments' => fn ($q) => $q->where('statut', 'complete')->latest(),
        ]);

        return response()->json([
            'student'        => $student,
            'mois_non_payes' => $student->mois_non_payes,
            'a_jour'         => empty($student->mois_non_payes),
        ]);
    }

    /** Télécharger la liste d'une classe en PDF */
    public function classListPdf(Request $request)
    {
        $request->validate([
            'filiere_id' => 'required|exists:filieres,id',
            'license_id' => 'nullable|exists:licenses,id',
        ]);

        $students = Student::with(['filiere', 'license'])
            ->where('filiere_id', $request->filiere_id)
            ->when($request->license_id, fn ($q) => $q->where('license_id', $request->license_id))
            ->whereIn('statut_inscription', ['accepte', 'en_attente_paiement', 'en_attente'])
            ->orderBy('nom')
            ->get();

        $filiere = Filiere::findOrFail($request->filiere_id);
        $license = $request->license_id ? License::find($request->license_id) : null;

        $path     = $this->pdfService->generateClassList($students, $filiere, $license);
        $fullPath = Storage::disk('public')->path($path);

        return response()->download(
            $fullPath,
            'liste_' . ($filiere->code ?? 'classe') . '_' . now()->format('Ymd') . '.pdf',
            ['Content-Type' => 'application/pdf']
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
