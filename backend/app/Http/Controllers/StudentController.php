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
use App\Services\PDFService;
use App\Mail\InscriptionReceived;
use App\Mail\NouvelleInscription;
use Illuminate\Support\Facades\Mail;

class StudentController extends Controller
{
    public function __construct(
        private WavePaymentService $waveService,
        private QRCodeService $qrService,
    ) {}

    /**
     * Etape 1: Création du compte (Public)
     */
    public function creerCompte(Request $request)
    {
        $request->validate([
            'nom'          => 'required|string|max:100',
            'prenom'       => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'mot_de_passe' => 'required|string|min:8|confirmed',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $user = User::create([
                'name'     => $request->prenom . ' ' . $request->nom,
                'email'    => $request->email,
                'password' => Hash::make($request->mot_de_passe),
                'role'     => 'student',
            ]);

            $student = Student::create([
                'user_id'            => $user->id,
                'nom'                => $request->nom,
                'prenom'             => $request->prenom,
                'statut_inscription' => 'brouillon',
                'statut_documents'   => 'en_attente',
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Compte créé avec succès !',
                'token'   => $token,
                'user'    => $user,
                'student' => $student,
            ], 201);
        });
    }

    /**
     * Etape 2: Sauvegarde partielle du dossier
     */
    public function sauvegarderEtape(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        // Validation partielle
        $rules = [
            'telephone'            => 'nullable|string|max:20',
            'sexe'                 => 'nullable|in:M,F',
            'date_naissance'       => 'nullable|date',
            'lieu_naissance'       => 'nullable|string|max:100',
            'adresse'              => 'nullable|string|max:255',
            'nationalite'          => 'nullable|string|max:100',
            'pays_residence'       => 'nullable|string|max:100',
            'filiere_id'           => 'nullable|exists:filieres,id',
            'license_id'           => 'nullable|exists:licenses,id',
            'est_transfert'        => 'nullable|boolean',
            'photo'                => 'nullable|image|max:2048',
            'doc_bac'              => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_releve_notes'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_cin'              => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_acte_naissance'   => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_bulletin_transfert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];

        $validated = $request->validate($rules);

        // Upload des fichiers
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('photos', 'public');
        }

        $docFields = ['doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance', 'doc_bulletin_transfert'];
        foreach ($docFields as $field) {
            if ($request->hasFile($field)) {
                $validated[$field] = $request->file($field)->store('documents/inscriptions', 'public');
            }
        }

        if (isset($validated['est_transfert']) && $validated['est_transfert']) {
            $validated['annee_scolaire'] = date('Y') . '-' . (date('Y') + 1);
        }

        $student->update($validated);

        return response()->json([
            'message' => 'Progression sauvegardée !',
            'student' => $student->fresh(['filiere', 'license']),
        ]);
    }

    /**
     * Etape 3: Soumission finale
     */
    public function soumettreDossier(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        // Check required fields
        $required = [
            'telephone', 'sexe', 'date_naissance', 'lieu_naissance', 'adresse',
            'nationalite', 'pays_residence', 'filiere_id', 'license_id',
            'doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance'
        ];

        foreach ($required as $field) {
            if (empty($student->$field)) {
                return response()->json(['message' => "Le champ {$field} est manquant pour finaliser l'inscription."], 422);
            }
        }

        if ($student->est_transfert && empty($student->doc_bulletin_transfert)) {
            return response()->json(['message' => "Le bulletin de transfert est manquant."], 422);
        }

        $student->update([
            'statut_inscription' => 'en_attente',
            'annee_scolaire'     => date('Y') . '-' . (date('Y') + 1), // ensure year
        ]);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => 'Pré-inscription reçue',
            'message'    => 'Votre dossier de pré-inscription a bien été reçu. Notre équipe pédagogique l\'examinera sous 48h et vous notifiera par email.',
            'type'       => 'info',
        ]);

        // Email de confirmation au candidat
        try {
            Mail::to($request->user()->email)->send(new InscriptionReceived($student->load(['filiere', 'license'])));
        } catch (\Exception $e) {
            \Log::error('Email candidat: ' . $e->getMessage());
        }

        // Notification aux admins et agents d'accueil
        try {
            $destinataires = User::whereIn('role', ['admin', 'accueil'])->pluck('email')->toArray();
            if (!empty($destinataires)) {
                Mail::to($destinataires)->send(new NouvelleInscription($student->load(['filiere', 'license', 'user'])));
            }
        } catch (\Exception $e) {
            \Log::error('Email admin/accueil: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Dossier soumis avec succès !',
            'student' => $student->fresh(['filiere', 'license']),
        ]);
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

    /** Download student card PDF (student) */
    public function downloadCard(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->with('card')->firstOrFail();
        $card = $student->card;
        // If no card exists, or PDF path missing or file missing, try to (re)generate using QRCodeService
        if (!$card || !$card->qr_pdf_path || !file_exists(storage_path('app/public/' . ($card->qr_pdf_path ?? '')))) {
            try {
                // ensure a StudentCard + QR are created and PDF generated
                app(QRCodeService::class)->generateStudentCard($student->fresh());
                $student->refresh();
                $card = $student->card;
            } catch (\Exception $e) {
                \Log::warning('Regeneration carte failed: ' . $e->getMessage());
            }
        }

        if (!$card || !$card->qr_pdf_path) {
            return response()->json(['message' => 'Aucune carte PDF disponible'], 404);
        }

        $path = storage_path('app/public/' . $card->qr_pdf_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($path, basename($path));
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
        $request->validate([
            'qr_data'   => 'nullable|string',
            'matricule' => 'nullable|string',
        ]);

        // If matricule provided, lookup student directly
        if ($request->filled('matricule')) {
            $mat = $request->matricule;
            $student = Student::where('matricule', $mat)
                ->with(['filiere', 'license', 'payments'])
                ->first();

            if (!$student) {
                return response()->json(['valide' => false, 'message' => 'Étudiant introuvable'], 404);
            }

            $moisNonPaies = $student->mois_non_payes;
            $dernierMoisNonPaye = !empty($moisNonPaies);

            return response()->json([
                'valide'   => true,
                'etudiant' => [
                    'nom' => $student->full_name,
                    'matricule' => $student->matricule,
                    'filiere' => $student->filiere?->nom,
                    'license' => $student->license?->nom,
                    'annee' => $student->annee_scolaire,
                    'photo' => $student->photo ? asset('storage/' . $student->photo) : null,
                    'statut_paiement' => $dernierMoisNonPaye ? 'non_a_jour' : 'a_jour',
                    'mois_non_payes' => $moisNonPaies,
                ],
            ]);
        }

        if (!$request->filled('qr_data')) {
            return response()->json(['valide' => false, 'message' => 'Aucun QR ou matricule fourni'], 422);
        }

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
