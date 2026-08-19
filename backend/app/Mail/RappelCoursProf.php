<?php

namespace App\Mail;

use App\Models\EmploiDuTemps;
use App\Models\Matiere;
use App\Models\Professeur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RappelCoursProf extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Professeur $professeur, public EmploiDuTemps $creneau, public Matiere $matiere, public string $classeLabel) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Rappel — Cours dans 2 heures');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.rappel_cours_prof');
    }
}
