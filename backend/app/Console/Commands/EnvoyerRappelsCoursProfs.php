<?php

namespace App\Console\Commands;

use App\Mail\RappelCoursProf as RappelCoursProfMail;
use App\Models\EmploiDuTemps;
use App\Models\RappelCours;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/** Envoie un email au professeur 2h avant chaque cours de son emploi du temps —
 *  destine a tourner toutes les 5 minutes via le scheduler Laravel. */
class EnvoyerRappelsCoursProfs extends Command
{
    protected $signature = 'cours:rappels-profs';
    protected $description = 'Envoie un rappel par email aux profs 2h avant chacun de leurs cours';

    private const JOURS_FR = [0 => 'dimanche', 1 => 'lundi', 2 => 'mardi', 3 => 'mercredi', 4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi'];

    public function handle(): void
    {
        $now = now();
        $jourAujourdhui = self::JOURS_FR[$now->dayOfWeek];
        $debutFenetre = $now->copy()->addHours(2)->format('H:i:s');
        $finFenetre = $now->copy()->addHours(2)->addMinutes(5)->format('H:i:s');

        $creneaux = EmploiDuTemps::where('jour', $jourAujourdhui)
            ->whereBetween('heure_debut', [$debutFenetre, $finFenetre])
            ->with(['matiere.professeur.user', 'matiere.module.semestre.license.filiere', 'matiere.semestre.license.filiere'])
            ->get();

        $envoyes = 0;
        foreach ($creneaux as $creneau) {
            $matiere = $creneau->matiere;
            $professeur = $matiere?->professeur;
            if (!$professeur || !$professeur->user_id || !$professeur->user) continue;

            $dejaEnvoye = RappelCours::where('creneau_id', $creneau->id)->where('date', $now->toDateString())->exists();
            if ($dejaEnvoye) continue;

            $semestre = $matiere->semestreResolu();
            $classeLabel = trim(($semestre?->license?->filiere?->nom ?? '') . ' — ' . ($semestre?->license?->nom ?? ''), ' —');

            try {
                Mail::to($professeur->user->email)->send(new RappelCoursProfMail($professeur, $creneau, $matiere, $classeLabel));
                RappelCours::create(['creneau_id' => $creneau->id, 'date' => $now->toDateString(), 'envoye_le' => $now]);
                $envoyes++;
            } catch (\Throwable $e) {
                \Log::warning('Rappel cours prof: ' . $e->getMessage());
            }
        }

        $this->info("{$envoyes} rappel(s) envoyé(s).");
    }
}
