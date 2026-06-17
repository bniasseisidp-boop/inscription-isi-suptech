<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Payment;
use App\Models\Student;

class WavePaymentService
{
    private string $apiKey;
    private string $baseUrl = 'https://api.wave.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.wave.api_key');
    }

    /**
     * Create a Wave checkout session for payment
     */
    public function createCheckoutSession(Student $student, Payment $payment): array
    {
        $successUrl = config('app.frontend_url') . '/student/paiement/succes?payment_id=' . $payment->id;
        $errorUrl   = config('app.frontend_url') . '/student/paiement/erreur?payment_id=' . $payment->id;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type'  => 'application/json',
        ])->post($this->baseUrl . '/checkout/sessions', [
            'amount'      => (int)($payment->montant * 100),
            'currency'    => 'XOF',
            'error_url'   => $errorUrl,
            'success_url' => $successUrl,
            'client_reference' => 'PAYMENT-' . $payment->id,
            'restrict_payer_mobile' => false,
        ]);

        if ($response->failed()) {
            throw new \Exception('Wave API error: ' . $response->body());
        }

        $data = $response->json();

        $payment->update([
            'wave_checkout_id' => $data['id'],
            'wave_session_id'  => $data['id'],
        ]);

        return [
            'checkout_url' => $data['wave_launch_url'],
            'session_id'   => $data['id'],
        ];
    }

    /**
     * Verify webhook signature from Wave
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $secret = config('services.wave.webhook_secret');
        $expected = hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }

    /**
     * Handle Wave webhook event (payment completion)
     */
    public function handleWebhook(array $event): void
    {
        if ($event['type'] !== 'checkout.session.completed') {
            return;
        }

        $sessionId = $event['data']['id'];
        $payment = Payment::where('wave_checkout_id', $sessionId)->first();

        if (!$payment) {
            return;
        }

        $payment->update([
            'statut'              => 'complete',
            'date_paiement'       => now(),
            'wave_transaction_id' => $event['data']['transaction_id'] ?? null,
        ]);

        app(PDFService::class)->generateReceipt($payment);

        $payment->student->user->notify(
            new \App\Notifications\PaymentReceived($payment)
        );
    }

    /**
     * Manually record a cash/transfer payment (by cashier)
     */
    public function recordManualPayment(Payment $payment, string $methode = 'especes'): void
    {
        $payment->update([
            'statut'        => 'complete',
            'date_paiement' => now(),
            'methode'       => $methode,
        ]);

        app(PDFService::class)->generateReceipt($payment);
    }
}
