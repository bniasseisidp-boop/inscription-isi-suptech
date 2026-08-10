<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class CarteEtudiante extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public string $cardPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🪪 Votre carte étudiante ISI SUPTECH est prête !',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.carte_etudiante',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->cardPath)
                ->as('carte_etudiante_' . $this->student->matricule . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
