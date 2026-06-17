<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\StudentNotification;
use App\Services\WavePaymentService;
use App\Services\QRCodeService;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Mail\InscriptionReceived;
use Illuminate\Support\Facades\Mail;

class StudentController extends Controller
{
    public function __construct(
        private WavePaymentService $waveService,
        private QRCodeService $qrService,
    ) {}

    /**
     * Submit pre-inscription (public)
     */
    public function preInscription(Request $request)
    {
        $validated = $request->validate([
            'nom'             => 'required|string|max:100',
            'prenom'          => 'required|string|max:100',
            'email'           => 'required|email|unique:users,email',
            'telephone'       => 'required|string|max:20',
            'sexe'            => 'required|in:M,F',
            'date_naissance'  => 'required|date|before:-15 years',
            'lieu_naissance'  => 'required|string|max:100',
            'adresse'         => 'required|string|max:255',
            'nationalite'     => 'required|string|max:100',
            'pays_residence'  => 'required|string|max:100',
            'filiere_id'      => 'required|exists:filieres,id',
            'license_id'      => 'required|exists:licenses,id',
            'mot_de_passe'    => 'required|string|min:8|confirmed',
            'photo'           => 'nullable|image|max:2048',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        $user = User::create([
            'name'     => $validated['prenom'] . ' ' . $validated['nom'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['mot_de_passe']),
            'role'     => 'student',
        ]);

        $student = Student::create([
            'user_id'          => $user->id,
            'nom'              => $validated['nom'],
            'prenom'           => $validated['prenom'],
            'telephone'        => $validated['telephone'],
            'sexe'             => $validated['sexe'],
            'date_naissance'   => $validated['date_naissance'],
            'lieu_naissance'   => $validated['lieu_naissance'],
            'adresse'          => $validated['adresse'],
            'nationalite'      => $validated['nationalite'],
            'pays_residence'   => $validated['pays_residence'],
            'filiere_id'       => $validated['filiere_id'],
            'license_id'       => $validated['license_id'],
            'annee_scolaire'   => date('Y') . '-' . (date('Y') + 1),
            'photo'            => $photoPath,
            'statut_inscription' => 'en_attente',
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => 'Pré-inscription reçue',
            'message'    => 'Votre pré-inscription a bien été reçue. Votre dossier est en cours d\'examen par notre équipe pédagogique.',
            'type'       => 'info',
        ]);

        try {
            Mail::to($user->email)->send(new InscriptionReceived($student));
        } catch (\Exception $e) {
            \Log::error('Email error: ' . $e->getMessage());
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Pré-inscription soumise avec succès !',
            'token'   => $token,
            'user'    => $user,
            'student' => $student->load(['filiere', 'license']),
        ], 201);
    }

    /**
     * Get current student dashboard data
     */
    public function dashboard(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)
            ->with(['filiere', 'license', 'payments' => function ($q) {
                $q->where('statut', 'complete')->latest()->take(10);
            }, 'notifications' => function ($q) {
                $q->latest()->take(10);
            }, 'card'])
            ->firstOrFail();

        return response()->json([
            'student'         => $student,
            'mois_non_payes'  => $student->mois_non_payes,
            'a_jour'          => empty($student->mois_non_payes),
        ]);
    }

    /**
     * Initiate Wave payment
     */
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'type'   => 'required|in:inscription,mensualite',
            'mois'   => 'required_if:type,mensualite|string|nullable',
        ]);

        $student = Student::where('user_id', $request->user()->id)
            ->with('license')
            ->firstOrFail();

        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Votre inscription n\'est pas encore confirmée.'], 403);
        }

        $montant = $request->type === 'inscription'
            ? $student->license->frais_inscription
            : $student->license->frais_mensuel;

        $payment = Payment::create([
            'student_id' => $student->id,
            'type'       => $request->type,
            'montant'    => $montant,
            'mois'       => $request->mois,
            'annee'      => date('Y'),
            'statut'     => 'en_attente',
            'methode'    => 'wave',
        ]);

        $checkoutData = $this->waveService->createCheckoutSession($student, $payment);

        return response()->json($checkoutData);
    }

    /**
     * Get student payments history
     */
    public function payments(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $payments = $student->payments()->latest()->paginate(20);

        return response()->json($payments);
    }

    /**
     * Mark notifications as read
     */
    public function markNotificationsRead(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $student->notifications()->update(['lu' => true]);

        return response()->json(['message' => 'Notifications marquées comme lues']);
    }

    /**
     * Verify QR code (public, for accueil)
     */
    public function verifyQR(Request $request)
    {
        $request->validate(['qr_data' => 'required|string']);
        return response()->json($this->qrService->verifyQRCode($request->qr_data));
    }

    /**
     * Get public student list (for accueil display)
     */
    public function publicList()
    {
        $students = Student::where('statut_inscription', 'accepte')
            ->where('inscription_payee', true)
            ->with(['filiere', 'license'])
            ->select(['id', 'nom', 'prenom', 'photo', 'filiere_id', 'license_id', 'annee_scolaire', 'matricule'])
            ->get()
            ->map(fn($s) => [
                'id'          => $s->id,
                'nom'         => $s->full_name,
                'photo'       => $s->photo ? asset('storage/' . $s->photo) : null,
                'filiere'     => $s->filiere?->nom,
                'license'     => $s->license?->nom,
                'annee'       => $s->annee_scolaire,
                'matricule'   => $s->matricule,
            ]);

        return response()->json($students);
    }
}
