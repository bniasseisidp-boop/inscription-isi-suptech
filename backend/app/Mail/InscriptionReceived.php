<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InscriptionReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Student $student) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pré-inscription reçue — ISI SUPTECH',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.inscription_received',
        );
    }
}
