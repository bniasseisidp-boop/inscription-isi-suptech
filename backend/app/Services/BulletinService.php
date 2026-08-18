<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Semestre;
use App\Models\Student;

class BulletinService
{
    /** Seuil de validation d'un module (moyenne pondérée par coef des matières) */
    const SEUIL_VALIDATION = 10;

    /** Moyenne pondérée (par coef) des notes de l'étudiant pour les matières d'un module. */
    public function moyenneModule(Student $student, Module $module, string $anneeScolaire): ?float
    {
        $module->loadMissing('matieres');
        $notes = $student->notes()
            ->whereIn('matiere_id', $module->matieres->pluck('id'))
            ->where('annee_scolaire', $anneeScolaire)
            ->get()
            ->keyBy('matiere_id');

        $sommeCoef = 0;
        $sommePonderee = 0;
        foreach ($module->matieres as $matiere) {
            $note = $notes->get($matiere->id);
            if (!$note) continue;
            $sommeCoef += (float) $matiere->coef;
            $sommePonderee += (float) $note->note * (float) $matiere->coef;
        }

        return $sommeCoef > 0 ? round($sommePonderee / $sommeCoef, 2) : null;
    }

    /** Un module est validé si toutes ses matières ont une note ET la moyenne pondérée ≥ 10. */
    public function moduleValide(Student $student, Module $module, string $anneeScolaire): bool
    {
        $module->loadMissing('matieres');
        $nbNotes = $student->notes()
            ->whereIn('matiere_id', $module->matieres->pluck('id'))
            ->where('annee_scolaire', $anneeScolaire)
            ->count();
        if ($nbNotes < $module->matieres->count()) return false;

        $moyenne = $this->moyenneModule($student, $module, $anneeScolaire);
        return $moyenne !== null && $moyenne >= self::SEUIL_VALIDATION;
    }

    /** Détail par module d'un semestre pour un étudiant : moyenne, validé, crédits obtenus. */
    public function detailSemestre(Student $student, Semestre $semestre, string $anneeScolaire): array
    {
        $semestre->loadMissing('modules.matieres');
        $modules = [];
        $creditsObtenus = 0;
        $sommePonderee = 0;
        $sommeCredits = 0;

        foreach ($semestre->modules as $module) {
            $moyenne = $this->moyenneModule($student, $module, $anneeScolaire);
            $valide = $this->moduleValide($student, $module, $anneeScolaire);
            if ($valide) $creditsObtenus += $module->credits;
            if ($moyenne !== null) {
                $sommePonderee += $moyenne * $module->credits;
                $sommeCredits += $module->credits;
            }
            $modules[] = [
                'module' => $module,
                'moyenne' => $moyenne,
                'valide' => $valide,
            ];
        }

        $moyenneGenerale = $sommeCredits > 0 ? round($sommePonderee / $sommeCredits, 2) : null;
        $semestreValide = $creditsObtenus >= $semestre->credits_requis;

        return [
            'semestre' => $semestre,
            'modules' => $modules,
            'moyenne_generale' => $moyenneGenerale,
            'credits_obtenus' => $creditsObtenus,
            'credits_requis' => $semestre->credits_requis,
            'valide' => $semestreValide,
            'mention' => $moyenneGenerale !== null ? $this->mentionDe($moyenneGenerale) : null,
        ];
    }

    /** Échelle de mention standard (système français / LMD). */
    public function mentionDe(float $moyenne): string
    {
        return match (true) {
            $moyenne >= 16 => 'Très Bien',
            $moyenne >= 14 => 'Bien',
            $moyenne >= 12 => 'Assez Bien',
            $moyenne >= 10 => 'Passable',
            default => 'Insuffisant',
        };
    }
}
