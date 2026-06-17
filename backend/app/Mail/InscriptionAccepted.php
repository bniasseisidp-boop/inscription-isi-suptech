<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class InscriptionAccepted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public string $pdfPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Votre inscription est acceptée — ISI SUPTECH',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inscription_accepted',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->pdfPath)
                ->as('lettre_acceptation_' . $this->student->matricule . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
