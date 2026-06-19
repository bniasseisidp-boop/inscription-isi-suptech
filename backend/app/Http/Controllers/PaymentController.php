<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use App\Models\MoisDesactive;
use App\Models\StudentNotification;
use App\Services\WavePaymentService;
use App\Services\PDFService;
use Illuminate\Http\Request;

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
        $payments = Payment::with(['student.user', 'student.filiere', 'student.license'])
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
            'statut'       => 'complete',
            'methode'      => $request->methode,
            'date_paiement'=> now(),
            'saisi_par'    => $request->user()->id,
            'notes'        => $request->notes,
        ]);

        // Si paiement inscription → activer le compte étudiant
        if ($request->type === 'inscription') {
            $student->update([
                'inscription_payee'  => true,
                'statut_inscription' => 'accepte',
            ]);

            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '✅ Paiement confirmé — Inscription validée !',
                'message'    => "Votre paiement d'inscription a été enregistré. Votre compte étudiant est maintenant actif. Bienvenue à ISI SUPTECH !",
                'type'       => 'success',
            ]);
        }

        // Générer le reçu PDF
        try {
            $this->pdfService->generateReceipt($payment->load('student.license'));
        } catch (\Exception $e) {
            \Log::warning('PDF reçu: ' . $e->getMessage());
        }

        $payment->refresh();

        return response()->json([
            'message'  => 'Paiement enregistré avec succès',
            'payment'  => $payment->load(['student.user', 'student.filiere', 'student.license']),
            'recu_url' => $payment->recu_pdf_path
                ? asset('storage/' . $payment->recu_pdf_path)
                : null,
        ]);
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

    /** Download receipt PDF */
    public function downloadReceipt(Payment $payment)
    {
        if (!$payment->recu_pdf_path) {
            $this->pdfService->generateReceipt($payment);
            $payment->refresh();
        }

        return response()->download(storage_path('app/public/' . $payment->recu_pdf_path));
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
