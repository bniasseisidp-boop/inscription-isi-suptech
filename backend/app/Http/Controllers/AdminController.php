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

        try {
            Mail::to($student->email)->send(new InscriptionAccepted($student, $pdfPath));
        } catch (\Exception $e) {
            \Log::error('Email acceptation non envoyé à ' . $student->email . ': ' . $e->getMessage());
        }

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

        return response()->json([
            'message' => 'Profil verrouillé avec succès.',
            'student' => $student->fresh(),
        ]);
    }

    /** Reject student inscription */
    public function rejectStudent(Request $request, Student $student)
    {
        $request->validate(['motif' => 'required|string']);

        $student->update([
            'statut_inscription' => 'rejete',
            'notes_admin'        => $request->motif,
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => 'Inscription non retenue',
            'message'    => 'Après examen de votre dossier, nous ne pouvons pas donner suite à votre demande. Motif : ' . $request->motif,
            'type'       => 'danger',
        ]);

        return response()->json(['message' => 'Inscription rejetée']);
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

        $user = User::create([
            'name'     => $validated['prenom'] . ' ' . $validated['nom'],
            'email'    => $validated['email'],
            'password' => Hash::make(\Str::random(12)),
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

        return response()->json(['message' => 'Étudiant créé', 'student' => $student->fresh()], 201);
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
        $locked = \DB::table('site_settings')->where('cle', 'filieres_lock_pedagogique')->value('valeur');
        return response()->json([
            'filieres_lock_pedagogique' => $locked === '1',
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'filieres_lock_pedagogique' => 'required|boolean',
        ]);
        \DB::table('site_settings')->updateOrInsert(
            ['cle' => 'filieres_lock_pedagogique'],
            ['valeur' => $validated['filieres_lock_pedagogique'] ? '1' : '0', 'updated_at' => now(), 'created_at' => now()]
        );
        return response()->json([
            'filieres_lock_pedagogique' => $validated['filieres_lock_pedagogique'],
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

        // Truncate data tables (keep users, filieres, licenses, staff)
        \DB::statement('PRAGMA foreign_keys = OFF');
        Payment::query()->forceDelete();
        \App\Models\StudentCard::query()->forceDelete();
        StudentNotification::query()->truncate();
        Student::withTrashed()->forceDelete();
        \DB::statement('PRAGMA foreign_keys = ON');

        return response()->json(['message' => 'Toutes les données de test ont été supprimées.']);
    }

    /** List staff accounts */
    public function staff()
    {
        return response()->json(User::whereIn('role', ['admin', 'cashier', 'accueil', 'pedagogique'])->get());
    }

    public function createStaff(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users',
            'role'     => 'required|in:admin,cashier,accueil,pedagogique',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create(array_merge($validated, [
            'password' => Hash::make($validated['password']),
        ]));

        return response()->json($user, 201);
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

    /** Permanently delete student */
    public function forceDeleteStudent(int $id)
    {
        $student = Student::onlyTrashed()->findOrFail($id);
        $student->forceDelete();
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
}
