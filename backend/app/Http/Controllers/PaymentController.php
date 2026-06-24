<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use App\Models\MoisDesactive;
use App\Models\StudentNotification;
use App\Services\WavePaymentService;
use App\Services\PDFService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function __construct(
        private WavePaymentService $waveService,
        private PDFService $pdfService,
    ) {}

    /** Wave webhook endpoint */
    public function waveWebhook(Request $request)
    {
        $signature = $request->header('Wave-Signature');
        $payload   = $request->getContent();

        if (!$this->waveService->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $this->waveService->handleWebhook($request->all());

        return response()->json(['received' => true]);
    }

    /** Cashier list: all payments */
    public function index(Request $request)
    {
        $payments = Payment::with(['student.filiere', 'student.license', 'saiseur'])
            ->when($request->search, fn($q) => $q->whereHas('student', function ($sq) use ($request) {
                $sq->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->latest()
            ->paginate(30);

        return response()->json($payments);
    }

    /** Cashier manually records a payment — immediately complete */
    public function manualPayment(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type'       => 'required|in:inscription,mensualite,autre',
            'montant'    => 'required|numeric|min:1',
            'mois'       => 'required_if:type,mensualite|nullable|string',
            'methode'    => 'required|in:especes,virement,cheque,wave',
            'notes'      => 'nullable|string',
        ]);

        $student = Student::with('license')->findOrFail($request->student_id);

        // Frais annexes fixes (depuis site_settings)
        $settings       = DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmea      = floatval($settings['frais_amea']      ?? 10000);
        $fraisTenue     = floatval($settings['frais_tenue']     ?? 60000);
        $fraisAssurance = floatval($settings['frais_assurance'] ?? 10000);
        $fraisMensuel   = floatval($student->license?->frais_mensuel ?? 0);

        // Montant attendu selon le type
        $dejaPayeInscription = 0;
        $dernierMoisCle      = null;

        if ($request->type === 'inscription') {
            $fraisInscriptionBase = floatval($student->license?->frais_inscription ?? 0);
            // Total dû = inscription + AMEA + tenue + assurance + dernier mois
            $montantDu = $fraisInscriptionBase + $fraisAmea + $fraisTenue + $fraisAssurance + $fraisMensuel;
            $dejaPayeInscription = floatval(
                Payment::where('student_id', $request->student_id)->where('type', 'inscription')->sum('montant')
            );
            $totalApresVersement = $dejaPayeInscription + floatval($request->montant);
            $statut = $totalApresVersement >= $montantDu ? 'complete' : 'partiel';
            // Calculer le dernier mois (utilisé si inscription complète)
            if ($student->license) {
                $moisFin    = intval($student->license->mois_fin    ?? 6);
                $moisDebut  = intval($student->license->mois_debut  ?? 9);
                $now        = \Carbon\Carbon::now();
                $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
                $anneeFin   = $anneeDebut + ($moisFin < $moisDebut ? 1 : 0);
                $dernierMoisCle = $anneeFin . '-' . str_pad($moisFin, 2, '0', STR_PAD_LEFT);
            }
        } elseif ($request->type === 'mensualite') {
            $montantDu   = $fraisMensuel;
            $avanceActuelle = floatval($student->avance_paiement ?? 0);
            // Montant effectif = versement + avance antérieure (positive = crédit, négative = déficit)
            $montantEffectif = floatval($request->montant) + $avanceActuelle;
            $statut = $montantEffectif >= $fraisMensuel ? 'complete' : 'partiel';
            // Nouvelle avance (positive = surplus reporté, négative = déficit reporté)
            $nouvelleAvance = round($montantEffectif - $fraisMensuel, 2);
        } else {
            $montantDu = floatval($request->montant);
            $statut    = 'complete';
        }

        // Libellé automatique
        $libelle = match($request->type) {
            'inscription' => "Frais d'inscription — " . ($student->license?->nom ?? ''),
            'mensualite'  => 'Mensualité ' . ($request->mois ?? date('Y-m')),
            default       => 'Paiement divers',
        };

        $payment = Payment::create([
            'student_id'   => $request->student_id,
            'type'         => $request->type,
            'libelle'      => $libelle,
            'montant'      => $request->montant,
            'mois'         => $request->mois,
            'annee'        => date('Y'),
            'statut'       => $statut,
            'methode'      => $request->methode,
            'date_paiement'=> now(),
            'saisi_par'    => $request->user()->id,
            'notes'        => $request->notes,
        ]);

        // ── Inscription : activation + dernier mois automatique ──
        if ($request->type === 'inscription' && $statut === 'complete') {
            $student->update([
                'inscription_payee'  => true,
                'statut_inscription' => 'accepte',
            ]);
            // Créer automatiquement le paiement du dernier mois (avance)
            if ($dernierMoisCle) {
                $dejaPayeDernierMois = Payment::where('student_id', $student->id)
                    ->where('type', 'mensualite')->where('mois', $dernierMoisCle)->sum('montant');
                if ($dejaPayeDernierMois == 0) {
                    Payment::create([
                        'student_id'    => $student->id,
                        'type'          => 'mensualite',
                        'libelle'       => 'Dernier mois (avance inscription) — ' . $dernierMoisCle,
                        'montant'       => $fraisMensuel,
                        'mois'          => $dernierMoisCle,
                        'annee'         => date('Y'),
                        'statut'        => 'complete',
                        'methode'       => $request->methode,
                        'date_paiement' => now(),
                        'saisi_par'     => $request->user()->id,
                        'notes'         => 'Créé automatiquement lors du paiement complet de l\'inscription',
                    ]);
                }
            }
            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '✅ Paiement confirmé — Inscription validée !',
                'message'    => "Votre paiement d'inscription a été enregistré (frais d'inscription + AMEA + tenue + assurance + dernier mois). Votre compte étudiant est maintenant actif. Bienvenue à ISI SUPTECH !",
                'type'       => 'success',
            ]);
        } elseif ($request->type === 'inscription' && $statut === 'partiel') {
            $soldeRestant = $montantDu - ($dejaPayeInscription + floatval($request->montant));
            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '⚠️ Paiement partiel enregistré',
                'message'    => "Un versement partiel de " . number_format($request->montant, 0, ',', ' ') . " FCFA a été enregistré. Solde restant dû : " . number_format($soldeRestant, 0, ',', ' ') . " FCFA. Votre inscription sera validée dès réception du solde complet.",
                'type'       => 'warning',
            ]);
        }

        // ── Mensualité : mettre à jour l'avance/déficit ──
        if ($request->type === 'mensualite') {
            $student->update(['avance_paiement' => $nouvelleAvance]);
            if ($nouvelleAvance < 0) {
                StudentNotification::create([
                    'student_id' => $student->id,
                    'titre'      => '⚠️ Paiement partiel — Déficit reporté',
                    'message'    => "Versement de " . number_format($request->montant, 0, ',', ' ') . " FCFA enregistré. Déficit de " . number_format(abs($nouvelleAvance), 0, ',', ' ') . " FCFA reporté sur le mois suivant.",
                    'type'       => 'warning',
                ]);
            } elseif ($nouvelleAvance > 0) {
                StudentNotification::create([
                    'student_id' => $student->id,
                    'titre'      => '✅ Mensualité payée — Avance reportée',
                    'message'    => "Mensualité réglée. Avance de " . number_format($nouvelleAvance, 0, ',', ' ') . " FCFA reportée sur le mois suivant.",
                    'type'       => 'success',
                ]);
            }
        }

        // Générer le reçu PDF
        try {
            $this->pdfService->generateReceipt($payment->load('student.license.filiere'), true);
        } catch (\Exception $e) {
            \Log::warning('PDF reçu: ' . $e->getMessage());
        }

        $payment->refresh();

        $extraData = [];
        if ($request->type === 'inscription') {
            $extraData['inscription_detail'] = [
                'frais_inscription' => floatval($student->license?->frais_inscription ?? 0),
                'frais_amea'        => $fraisAmea,
                'frais_tenue'       => $fraisTenue,
                'frais_assurance'   => $fraisAssurance,
                'frais_dernier_mois'=> $fraisMensuel,
                'total_du'          => $montantDu,
                'total_paye'        => $dejaPayeInscription + floatval($request->montant),
                'restant'           => max(0, $montantDu - ($dejaPayeInscription + floatval($request->montant))),
                'dernier_mois_cle'  => $dernierMoisCle,
            ];
        }
        if ($request->type === 'mensualite') {
            $extraData['avance_paiement'] = $nouvelleAvance;
        }

        return response()->json(array_merge([
            'message'  => 'Paiement enregistré avec succès',
            'payment'  => $payment->load(['student.user', 'student.filiere', 'student.license']),
            'recu_url' => $payment->recu_pdf_path
                ? asset('storage/' . $payment->recu_pdf_path)
                : null,
        ], $extraData));
    }

    /** Students waiting for payment (statut en_attente_paiement) */
    public function etudiantsAttentePaiement(Request $request)
    {
        $query = Student::with(['filiere', 'license', 'user'])
            ->where('statut_inscription', 'en_attente_paiement')
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->latest();

        return response()->json($query->get());
    }

    /** Mois désactivés list (for cashier to know which months to skip) */
    public function moisDesactives()
    {
        return response()->json(MoisDesactive::orderBy('mois')->pluck('mois'));
    }

    /** Stream receipt PDF inline (called with Bearer token via fetch/blob) */
    public function downloadReceipt(Payment $payment)
    {
        $path     = $this->pdfService->generateReceipt($payment, false);
        $fullPath = Storage::disk('public')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Reçu introuvable'], 404);
        }

        $payment->load('student');
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', ($payment->student->nom ?? 'etudiant') . '_' . ($payment->student->prenom ?? '')));
        $moisSlug = $payment->mois ? '_' . $payment->mois : '';
        $fname = 'recu_ISI_' . $slug . $moisSlug . '_' . str_pad($payment->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $fname . '"',
        ]);
    }

    /** List students who haven't paid the given month (default: current month, callable from 5th) */
    public function impayesMois(Request $request)
    {
        $mois = $request->input('mois', now()->format('Y-m'));

        // All active students (inscription paid)
        $tous = \App\Models\Student::with(['filiere', 'license'])
            ->where('inscription_payee', true)
            ->get();

        // Students who paid this month
        $payeIds = Payment::where('statut', 'complete')
            ->where('type', 'mensualite')
            ->where('mois', $mois)
            ->pluck('student_id')
            ->unique();

        $impaye = $tous->whereNotIn('id', $payeIds)->values();

        return response()->json([
            'mois'   => $mois,
            'count'  => $impaye->count(),
            'data'   => $impaye,
        ]);
    }

    /** Download PDF list of unpaid students for a given month */
    public function impayesMoisPdf(Request $request)
    {
        $mois = $request->input('mois', now()->format('Y-m'));

        $tous = \App\Models\Student::with(['filiere', 'license', 'user'])
            ->where('inscription_payee', true)
            ->get();

        $payeIds = Payment::where('statut', 'complete')
            ->where('type', 'mensualite')
            ->where('mois', $mois)
            ->pluck('student_id')
            ->unique();

        $etudiants = $tous->whereNotIn('id', $payeIds)->values()->toArray();

        $path     = $this->pdfService->generateImpayesPdf($etudiants, $mois);
        $fullPath = Storage::disk('public')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="impayes_ISI_' . $mois . '.pdf"',
        ]);
    }

    /** List students for cashier browser — inclut en_attente pour que le caissier trouve tout étudiant pré-inscrit */
    public function etudiantsList(Request $request)
    {
        $statutsDisponibles = ['accepte', 'en_attente_paiement', 'en_attente'];
        $statuts = ($request->statut && in_array($request->statut, $statutsDisponibles))
            ? [$request->statut]
            : $statutsDisponibles;

        $query = Student::with(['filiere', 'license', 'user'])
            ->whereIn('statut_inscription', $statuts)
            ->when($request->filiere_id, fn($q) => $q->where('filiere_id', $request->filiere_id))
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%')
                   ->orWhere('telephone', 'like', '%' . $request->search . '%');
            }))
            ->orderBy('nom')
            ->paginate(60);

        return response()->json($query);
    }

    /** Get payment tracking for a student (cashier view — includes backpay) */
    public function etudiantSuivi(Request $request, int $id)
    {
        $student = Student::with([
            'license',
            'payments' => fn($q) => $q->where('statut', 'complete')->orderBy('created_at'),
        ])->findOrFail($id);

        $license      = $student->license;
        $fraisMensuel = floatval($license?->frais_mensuel ?? 0);
        $moisDebut    = intval($license?->mois_debut ?? 9);
        $moisFin      = intval($license?->mois_fin ?? 6);
        $now          = \Carbon\Carbon::now();

        $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
        $startDate  = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1)->startOfMonth();
        $anneeFinOffset = ($moisFin < $moisDebut) ? 1 : 0;
        $endDate    = \Carbon\Carbon::create($anneeDebut + $anneeFinOffset, $moisFin, 1)->startOfMonth();
        $moisTotal  = (int) $startDate->diffInMonths($endDate) + 1;

        $paiementsMensuels = $student->payments->where('type', 'mensualite')->pluck('mois')->toArray();

        $mois    = [];
        $current = $startDate->copy();

        for ($i = 0; $i < $moisTotal; $i++) {
            $cle      = $current->format('Y-m');
            $estPasse = $current->lte($now);
            $estActuel = $current->isSameMonth($now);
            $estPaye  = in_array($cle, $paiementsMensuels);

            $mois[] = [
                'cle'       => $cle,
                'label'     => $current->isoFormat('MMMM YYYY'),
                'montant'   => $fraisMensuel,
                'paye'      => $estPaye,
                'en_retard' => $estPasse && !$estPaye && !$estActuel,
                'actuel'    => $estActuel,
                'futur'     => !$estPasse,
            ];

            $current->addMonth();
        }

        $moisPayes    = count(array_filter($mois, fn($m) => $m['paye']));
        $moisEnRetard = count(array_filter($mois, fn($m) => $m['en_retard']));

        $avancePaiement = floatval($student->avance_paiement ?? 0);

        // Pour le premier mois impayé, afficher le montant réel avec avance/déficit
        $premierImpayeTrouve = false;
        foreach ($mois as &$m) {
            $m['montant_reel'] = $fraisMensuel;
            $m['avance_appliquee'] = 0;
            if (!$m['paye'] && !$m['futur'] && !$premierImpayeTrouve) {
                $premierImpayeTrouve = true;
                $m['montant_reel'] = max(0, round($fraisMensuel - $avancePaiement, 2));
                $m['avance_appliquee'] = $avancePaiement;
            }
        }
        unset($m);

        // Frais annexes inscription
        $settingsAvance = DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmeaS  = floatval($settingsAvance['frais_amea']      ?? 10000);
        $fraisTenueS = floatval($settingsAvance['frais_tenue']     ?? 60000);
        $fraisAssurS = floatval($settingsAvance['frais_assurance'] ?? 10000);
        $dejaInscription = Payment::where('student_id', $student->id)->where('type', 'inscription')->sum('montant');
        $totalInscDu = floatval($license?->frais_inscription ?? 0) + $fraisAmeaS + $fraisTenueS + $fraisAssurS + $fraisMensuel;

        return response()->json([
            'student'           => $student,
            'mois'              => $mois,
            'frais_mensuel'     => $fraisMensuel,
            'mois_payes'        => $moisPayes,
            'mois_en_retard'    => $moisEnRetard,
            'mois_total'        => $moisTotal,
            'annee_scolaire'    => $anneeDebut . '-' . ($anneeDebut + 1),
            'avance_paiement'   => $avancePaiement,
            'inscription_detail'=> [
                'frais_inscription'  => floatval($license?->frais_inscription ?? 0),
                'frais_amea'         => $fraisAmeaS,
                'frais_tenue'        => $fraisTenueS,
                'frais_assurance'    => $fraisAssurS,
                'frais_dernier_mois' => $fraisMensuel,
                'total_du'           => $totalInscDu,
                'deja_paye'          => floatval($dejaInscription),
                'restant'            => max(0, $totalInscDu - floatval($dejaInscription)),
            ],
        ]);
    }

    /** Fee breakdown for inscription — fetched before payment so cashier sees all items */
    public function inscriptionDetails(Student $student)
    {
        $student->load('license');
        $settings       = DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmea      = floatval($settings['frais_amea']      ?? 10000);
        $fraisTenue     = floatval($settings['frais_tenue']     ?? 60000);
        $fraisAssurance = floatval($settings['frais_assurance'] ?? 10000);
        $fraisMensuel   = floatval($student->license?->frais_mensuel ?? 0);
        $fraisInscBase  = floatval($student->license?->frais_inscription ?? 0);
        $totalDu        = $fraisInscBase + $fraisAmea + $fraisTenue + $fraisAssurance + $fraisMensuel;
        $dejaPaye       = floatval(Payment::where('student_id', $student->id)->where('type', 'inscription')->sum('montant'));

        $dernierMoisCle = null;
        if ($student->license) {
            $moisFin    = intval($student->license->mois_fin    ?? 6);
            $moisDebut  = intval($student->license->mois_debut  ?? 9);
            $now        = \Carbon\Carbon::now();
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin   = $anneeDebut + ($moisFin < $moisDebut ? 1 : 0);
            $dernierMoisCle = $anneeFin . '-' . str_pad($moisFin, 2, '0', STR_PAD_LEFT);
        }

        return response()->json([
            'frais_inscription'  => $fraisInscBase,
            'frais_amea'         => $fraisAmea,
            'frais_tenue'        => $fraisTenue,
            'frais_assurance'    => $fraisAssurance,
            'frais_dernier_mois' => $fraisMensuel,
            'dernier_mois_cle'   => $dernierMoisCle,
            'total_du'           => $totalDu,
            'deja_paye'          => $dejaPaye,
            'restant'            => max(0, $totalDu - $dejaPaye),
        ]);
    }

    /** Stats for cashier dashboard */
    public function stats()
    {
        $today = now()->toDateString();
        return response()->json([
            'total_jour'     => Payment::where('statut', 'complete')->whereDate('date_paiement', $today)->sum('montant'),
            'total_mois'     => Payment::where('statut', 'complete')->whereMonth('date_paiement', now()->month)->sum('montant'),
            'count_jour'     => Payment::where('statut', 'complete')->whereDate('date_paiement', $today)->count(),
            'count_mois'     => Payment::where('statut', 'complete')->whereMonth('date_paiement', now()->month)->count(),
            'en_attente'     => Payment::where('statut', 'en_attente')->count(),
            'par_type'       => Payment::where('statut', 'complete')
                ->selectRaw('type, SUM(montant) as total, COUNT(*) as count')
                ->groupBy('type')
                ->get(),
        ]);
    }
}
