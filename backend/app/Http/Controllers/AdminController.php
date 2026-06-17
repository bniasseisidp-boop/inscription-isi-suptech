<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Payment;
use App\Models\Filiere;
use App\Models\License;
use App\Models\StudentNotification;
use App\Services\PDFService;
use App\Services\QRCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function __construct(
        private PDFService $pdfService,
        private QRCodeService $qrService,
    ) {}

    /** Dashboard stats */
    public function stats()
    {
        return response()->json([
            'total_etudiants'     => Student::count(),
            'en_attente'          => Student::where('statut_inscription', 'en_attente')->count(),
            'acceptes'            => Student::where('statut_inscription', 'accepte')->count(),
            'rejetes'             => Student::where('statut_inscription', 'rejete')->count(),
            'inscriptions_payees' => Student::where('inscription_payee', true)->count(),
            'total_paiements'     => Payment::where('statut', 'complete')->sum('montant'),
            'paiements_ce_mois'   => Payment::where('statut', 'complete')
                ->whereMonth('date_paiement', now()->month)->sum('montant'),
            'par_filiere'         => Student::where('statut_inscription', 'accepte')
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

    /** Accept student inscription */
    public function acceptStudent(Request $request, Student $student)
    {
        $request->validate(['notes' => 'nullable|string']);

        $matricule = Student::generateMatricule();

        $student->update([
            'statut_inscription' => 'accepte',
            'date_acceptation'   => now(),
            'accepte_par'        => $request->user()->id,
            'matricule'          => $matricule,
            'notes_admin'        => $request->notes,
        ]);

        $card = $this->qrService->generateStudentCard($student);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '🎉 Inscription Acceptée !',
            'message'    => "Félicitations ! Votre inscription a été acceptée. Votre matricule est : {$matricule}. Vous pouvez maintenant procéder au paiement de vos frais d'inscription.",
            'type'       => 'success',
        ]);

        $this->pdfService->generateAcceptanceLetter($student);

        return response()->json([
            'message' => 'Inscription acceptée avec succès',
            'student' => $student->fresh(['filiere', 'license', 'card']),
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
            'filiere_id'       => 'required|exists:filieres,id',
            'nom'              => 'required|string|max:100',
            'code'             => 'required|string|max:20|unique:licenses',
            'duree_annees'     => 'required|integer|min:1|max:5',
            'frais_inscription'=> 'required|numeric|min:0',
            'frais_mensuel'    => 'required|numeric|min:0',
        ]);
        return response()->json(License::create($validated), 201);
    }

    /** List staff accounts */
    public function staff()
    {
        return response()->json(User::whereIn('role', ['admin', 'cashier', 'accueil'])->get());
    }

    public function createStaff(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users',
            'role'     => 'required|in:admin,cashier,accueil',
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
}
