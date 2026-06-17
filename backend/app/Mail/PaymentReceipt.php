<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class PaymentReceipt extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Payment $payment,
        public string $pdfPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reçu de paiement — ISI SUPTECH #' . str_pad($this->payment->id, 6, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment_receipt',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->pdfPath)
                ->as('recu_paiement_' . str_pad($this->payment->id, 6, '0', STR_PAD_LEFT) . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
