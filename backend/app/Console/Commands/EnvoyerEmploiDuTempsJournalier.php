<?php

namespace App\Console\Commands;

use App\Mail\EmploiDuTempsJournalier as EmploiDuTempsJournalierMail;
use App\Models\EmploiDuTemps;
use App\Models\Semestre;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/** Envoie chaque matin a chaque etudiant son emploi du temps du jour — destine
 *  a tourner une fois par jour (tot le matin) via le scheduler Laravel. */
class EnvoyerEmploiDuTempsJournalier extends Command
{
    protected $signature = 'cours:emploi-du-temps-journalier';
    protected $description = "Envoie a chaque etudiant son emploi du temps du jour par email";

    private const JOURS_FR = [0 => 'dimanche', 1 => 'lundi', 2 => 'mardi', 3 => 'mercredi', 4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi'];

    public function handle(): void
    {
        $now = now();
        $jourAujourdhui = self::JOURS_FR[$now->dayOfWeek];

        $students = Student::where('statut_inscription', 'accepte')
            ->whereNotNull('license_id')
            ->whereHas('user')
            ->with('user')
            ->get();

        $envoyes = 0;
        foreach ($students as $student) {
            $semestreIds = Semestre::where('license_id', $student->license_id)->pluck('id');
            if ($semestreIds->isEmpty()) continue;

            $creneaux = EmploiDuTemps::where('jour', $jourAujourdhui)
                ->whereHas('matiere', function ($q) use ($semestreIds) {
                    $q->whereIn('semestre_id', $semestreIds)
                        ->orWhereHas('module', fn ($q2) => $q2->whereIn('semestre_id', $semestreIds));
                })
                ->with('matiere.professeur')
                ->orderBy('heure_debut')
                ->get();

            if ($creneaux->isEmpty()) continue;

            try {
                Mail::to($student->user->email)->send(new EmploiDuTempsJournalierMail($student, $creneaux, $jourAujourdhui));
                $envoyes++;
            } catch (\Throwable $e) {
                \Log::warning('Emploi du temps journalier: ' . $e->getMessage());
            }
        }

        $this->info("{$envoyes} email(s) envoyé(s).");
    }
}
