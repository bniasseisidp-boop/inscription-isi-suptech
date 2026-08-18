<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Semestre;
use App\Models\Student;

class BulletinService
{
    /** Seuil de validation d'une UE (moyenne pondérée par coef des matières) */
    const SEUIL_VALIDATION = 10;

    /**
     * Détail des matières d'un module pour un étudiant : MCC, Examen, Moy EC,
     * Coef EC, Moyenne Coef (= Moy EC × Coef) — sert de base à generateBulletin().
     */
    public function detailModule(Student $student, Module $module, string $anneeScolaire): array
    {
        $module->loadMissing('matieres');
        $notes = $student->notes()
            ->whereIn('matiere_id', $module->matieres->pluck('id'))
            ->where('annee_scolaire', $anneeScolaire)
            ->get()->keyBy('matiere_id');

        $lignes = [];
        $sommeCoef = 0;
        $sommePonderee = 0;

        foreach ($module->matieres as $matiere) {
            $note = $notes->get($matiere->id);
            $moyEc = $note?->moyenne; // null si mcc/examen pas encore saisis
            $moyenneCoef = $moyEc !== null ? round($moyEc * (float) $matiere->coef, 2) : null;

            if ($moyEc !== null) {
                $sommeCoef += (float) $matiere->coef;
                $sommePonderee += $moyenneCoef;
            }

            $lignes[] = [
                'matiere' => $matiere,
                'mcc' => $note?->mcc,
                'examen' => $note?->examen,
                'moyenne_ec' => $moyEc,
                'moyenne_coef' => $moyenneCoef,
                'appreciation' => $moyEc !== null ? $this->appreciationDe($moyEc) : null,
            ];
        }

        $moyenneUe = $sommeCoef > 0 ? round($sommePonderee / $sommeCoef, 2) : null;

        return [
            'module' => $module,
            'lignes' => $lignes,
            'total_moyenne_coef' => round($sommePonderee, 2),
            'moyenne_ue' => $moyenneUe,
            'valide' => $moyenneUe !== null && $moyenneUe >= self::SEUIL_VALIDATION,
        ];
    }

    /** Moyenne pondérée (par coef) des notes de l'étudiant pour les matières d'un module. */
    public function moyenneModule(Student $student, Module $module, string $anneeScolaire): ?float
    {
        return $this->detailModule($student, $module, $anneeScolaire)['moyenne_ue'];
    }

    public function moduleValide(Student $student, Module $module, string $anneeScolaire): bool
    {
        return $this->detailModule($student, $module, $anneeScolaire)['valide'];
    }

    /** Détail complet du bulletin d'un semestre pour un étudiant (UE par UE). */
    public function detailSemestre(Student $student, Semestre $semestre, string $anneeScolaire): array
    {
        $semestre->loadMissing('modules.matieres');
        $modules = [];
        $creditsObtenus = 0;
        $sommePonderee = 0;
        $sommeCredits = 0;

        foreach ($semestre->modules as $module) {
            $detail = $this->detailModule($student, $module, $anneeScolaire);
            if ($detail['valide']) $creditsObtenus += $module->credits;
            if ($detail['moyenne_ue'] !== null) {
                $sommePonderee += $detail['moyenne_ue'] * $module->credits;
                $sommeCredits += $module->credits;
            }
            $modules[] = $detail;
        }

        $moyenneGenerale = $sommeCredits > 0 ? round($sommePonderee / $sommeCredits, 2) : null;

        return [
            'semestre' => $semestre,
            'modules' => $modules,
            'moyenne_generale' => $moyenneGenerale,
            'credits_obtenus' => $creditsObtenus,
            'credits_requis' => $semestre->credits_requis,
            'valide' => $creditsObtenus >= $semestre->credits_requis,
            'mention' => $moyenneGenerale !== null ? $this->mentionDe($moyenneGenerale) : null,
        ];
    }

    /** Appréciation par matière/UE (échelle utilisée sur les bulletins ISI SUPTECH). */
    public function appreciationDe(float $moyenne): string
    {
        return match (true) {
            $moyenne >= 18 => 'Excellent',
            $moyenne >= 16 => 'Très bien',
            $moyenne >= 14 => 'Bien',
            $moyenne >= 12 => 'Assez bien',
            $moyenne >= 10 => 'Passable',
            default => 'Insuffisant',
        };
    }

    /** Mention globale du semestre (même échelle, casse "titre" pour les documents officiels). */
    public function mentionDe(float $moyenne): string
    {
        return match (true) {
            $moyenne >= 18 => 'Excellent',
            $moyenne >= 16 => 'Très Bien',
            $moyenne >= 14 => 'Bien',
            $moyenne >= 12 => 'Assez Bien',
            $moyenne >= 10 => 'Passable',
            default => 'Insuffisant',
        };
    }
}
