<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class EmploiDuTempsJournalier extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Student $student, public Collection $creneaux, public string $jourLabel) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Votre emploi du temps du jour — {$this->jourLabel}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.emploi_du_temps_journalier');
    }
}
