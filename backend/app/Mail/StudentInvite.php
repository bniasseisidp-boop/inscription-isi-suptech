<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentInvite extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $password, public Student $student) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Bienvenue sur ISI SUPTECH — Accès étudiant');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.student_invite');
    }
}
