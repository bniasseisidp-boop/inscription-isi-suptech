<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\StudentNotification;
use App\Services\WavePaymentService;
use App\Services\QRCodeService;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
     * Submit pre-inscription (public)
     */
    public function preInscription(Request $request)
    {
        $estTransfert = $request->boolean('est_transfert');

        $request->validate([
            'nom'                  => 'required|string|max:100',
            'prenom'               => 'required|string|max:100',
            'email'                => 'required|email|unique:users,email',
            'telephone'            => 'required|string|max:20',
            'sexe'                 => 'required|in:M,F',
            'date_naissance'       => 'required|date|before:-15 years',
            'lieu_naissance'       => 'required|string|max:100',
            'adresse'              => 'required|string|max:255',
            'nationalite'          => 'required|string|max:100',
            'pays_residence'       => 'required|string|max:100',
            'tuteur_nom'           => 'required|string|max:100',
            'tuteur_telephone'     => 'required|string|max:20',
            'tuteur_profession'    => 'nullable|string|max:100',
            'filiere_id'           => 'required|exists:filieres,id',
            'license_id'           => 'required|exists:licenses,id',
            'niveau_entree'        => 'nullable|string|max:20',
            'type_inscription'     => 'required|in:Privée,Bourse,Entreprise',
            'nature_bourse'        => 'nullable|string|max:150',
            'mot_de_passe'         => 'required|string|min:8|confirmed',
            'photo'                => 'nullable|image|max:2048',
            // Documents obligatoires
            'doc_bac'              => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_releve_notes'     => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_cin'              => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_acte_naissance'   => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            // Bulletin de transfert requis seulement si est_transfert
            'doc_bulletin_transfert' => $estTransfert
                ? 'required|file|mimes:pdf,jpg,jpeg,png|max:5120'
                : 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Stocker la photo de profil
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
        }

        // Stocker les documents dans un dossier sécurisé
        $docs = [];
        $docFields = ['doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance', 'doc_bulletin_transfert'];
        foreach ($docFields as $field) {
            if ($request->hasFile($field)) {
                $docs[$field] = $request->file($field)->store('documents/inscriptions', 'public');
            }
        }

        [$user, $student] = DB::transaction(function () use ($request, $photoPath, $docs, $estTransfert) {
            $prenomCap = Student::capitaliserNomPropre($request->prenom);
            $nomCap    = Student::capitaliserNomPropre($request->nom);

            $user = User::create([
                'name'     => $prenomCap . ' ' . $nomCap,
                'email'    => $request->email,
                'password' => Hash::make($request->mot_de_passe),
                'role'     => 'student',
            ]);

            $student = Student::create(array_merge([
                'user_id'            => $user->id,
                'nom'                => $request->nom,
                'prenom'             => $request->prenom,
                'telephone'          => $request->telephone,
                'sexe'               => $request->sexe,
                'date_naissance'     => $request->date_naissance,
                'lieu_naissance'     => $request->lieu_naissance,
                'adresse'            => $request->adresse,
                'nationalite'        => $request->nationalite,
                'pays_residence'     => $request->pays_residence,
                'tuteur_nom'         => $request->tuteur_nom,
                'tuteur_telephone'   => $request->tuteur_telephone,
                'tuteur_profession'  => $request->tuteur_profession,
                'filiere_id'         => $request->filiere_id,
                'license_id'         => $request->license_id,
                'niveau_entree'      => $request->niveau_entree,
                'type_inscription'   => $request->type_inscription,
                'nature_bourse'      => $request->nature_bourse,
                'annee_scolaire'     => date('Y') . '-' . (date('Y') + 1),
                'photo'              => $photoPath,
                'statut_inscription' => 'en_attente',
                'est_transfert'      => $estTransfert,
                'statut_documents'   => 'en_attente',
            ], $docs));

            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => 'Pré-inscription reçue',
                'message'    => 'Votre dossier de pré-inscription a bien été reçu. Notre équipe pédagogique l\'examinera sous 48h et vous notifiera par email.',
                'type'       => 'info',
            ]);

            return [$user, $student];
        });

        // Email de confirmation au candidat
        try {
            Mail::to($user->email)->send(new InscriptionReceived($student->load(['filiere', 'license'])));
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

        if ($request->type === 'inscription') {
            // 'en_attente_paiement' = parcours normal (accepté par l'admin, paiement à faire).
            // 'accepte' + inscription_payee=false = étudiant inscrit directement par l'accueil pédagogique.
            $peutPayerInscription = $student->statut_inscription === 'en_attente_paiement'
                || ($student->statut_inscription === 'accepte' && !$student->inscription_payee);
            if (!$peutPayerInscription) {
                return response()->json(['message' => "Votre dossier n'est pas encore accepté, ou vos frais d'inscription ont déjà été réglés."], 403);
            }
        } else {
            if ($student->statut_inscription !== 'accepte' || !$student->inscription_payee) {
                return response()->json(['message' => "Vous devez d'abord régler vos frais d'inscription avant de payer une mensualité."], 403);
            }
            $erreurMois = $student->moisEstPayable($request->mois);
            if ($erreurMois) {
                return response()->json(['message' => $erreurMois], 403);
            }
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
     * L'étudiant renvoie les pièces manquantes depuis son espace (dossier "à compléter" — statut rejete).
     * Remplace uniquement les documents fournis dans la requête et remet le dossier en attente de réexamen.
     */
    public function completerDocuments(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        if ($student->statut_inscription !== 'rejete') {
            return response()->json(['message' => "Votre dossier n'est pas en attente de compléments."], 422);
        }

        $request->validate([
            'doc_bac'                => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_releve_notes'       => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_cin'                => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_acte_naissance'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'doc_bulletin_transfert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $docFields = ['doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance', 'doc_bulletin_transfert'];
        $updates = [];
        foreach ($docFields as $field) {
            if ($request->hasFile($field)) {
                $updates[$field] = $request->file($field)->store('documents/inscriptions', 'public');
            }
        }

        if (empty($updates)) {
            return response()->json(['message' => 'Aucun document fourni.'], 422);
        }

        $updates['statut_inscription'] = 'en_attente';
        $updates['statut_documents']   = 'en_attente';
        $student->update($updates);

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '📤 Documents envoyés',
            'message'    => 'Vos documents ont bien été transmis à notre équipe pédagogique pour réexamen.',
            'type'       => 'info',
        ]);

        return response()->json([
            'message' => 'Documents envoyés — votre dossier est de nouveau en cours d\'examen.',
            'student' => $student->fresh(),
        ]);
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
     * Verify student by matricule (accueil desk)
     */
    public function verifyMatricule(Request $request, string $matricule)
    {
        $student = Student::where('matricule', strtoupper(trim($matricule)))
            ->with(['filiere', 'license', 'payments'])
            ->first();

        if (!$student) {
            return response()->json([
                'valide'  => false,
                'message' => 'Matricule introuvable — étudiant non reconnu.',
            ]);
        }

        $moisNonPayes      = $student->mois_non_payes;
        $inscriptionPayee  = (bool) $student->inscription_payee;
        $statutInscription = $student->statut_inscription;

        if (!$inscriptionPayee) {
            $statutPaiement = 'inscription_non_payee';
        } elseif (!empty($moisNonPayes)) {
            $statutPaiement = 'non_a_jour';
        } else {
            $statutPaiement = 'a_jour';
        }

        return response()->json([
            'valide'  => true,
            'etudiant' => [
                'nom'              => $student->full_name,
                'matricule'        => $student->matricule,
                'filiere'          => $student->filiere?->nom,
                'license'          => $student->license?->nom,
                'annee'            => $student->annee_scolaire,
                'photo'            => $student->photo ? asset('storage/' . $student->photo) : null,
                'inscription_payee'=> $inscriptionPayee,
                'statut_inscription' => $statutInscription,
                'statut_paiement'  => $statutPaiement,
                'mois_non_payes'   => $moisNonPayes,
            ],
        ]);
    }

    /**
     * Get public student list (for accueil display)
     */
    public function publicList()
    {
        $students = Student::where('statut_inscription', 'accepte')
            ->where('inscription_payee', true)
            ->with(['filiere', 'license',
                'payments' => fn ($q) => $q->whereIn('statut', ['complete', 'partiel']),
            ])
            ->select(['id', 'nom', 'prenom', 'photo', 'filiere_id', 'license_id', 'annee_scolaire', 'matricule', 'inscription_payee', 'statut_inscription'])
            ->get()
            ->map(fn($s) => [
                'id'             => $s->id,
                'nom'            => $s->full_name,
                'photo'          => $s->photo ? asset('storage/' . $s->photo) : null,
                'filiere'        => $s->filiere?->nom,
                'license'        => $s->license?->nom,
                'annee'          => $s->annee_scolaire,
                'matricule'      => $s->matricule,
                'a_jour'         => empty($s->mois_non_payes),
                'mois_non_payes' => $s->mois_non_payes,
            ]);

        return response()->json($students);
    }
}
