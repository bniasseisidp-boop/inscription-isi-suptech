<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class InscriptionPayee extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public string $attestationPath,
        public ?string $fichePath = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎓 Inscription confirmée — Vos documents officiels — ISI SUPTECH',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inscription_payee',
        );
    }

    public function attachments(): array
    {
        $files = [
            Attachment::fromPath($this->attestationPath)
                ->as('attestation_inscription_' . $this->student->matricule . '.pdf')
                ->withMime('application/pdf'),
        ];

        if ($this->fichePath) {
            $files[] = Attachment::fromPath($this->fichePath)
                ->as('fiche_inscription_' . $this->student->matricule . '.pdf')
                ->withMime('application/pdf');
        }

        return $files;
    }
}
