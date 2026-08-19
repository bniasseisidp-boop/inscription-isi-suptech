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
     *
     * @param bool $strict Mode "génération officielle" : une matière sans note
     *  saisie compte pour 0/20 dans le calcul (règle ISI SUPTECH — une note non
     *  renseignée au moment de la génération du bulletin est considérée comme 0).
     *  En mode aperçu (false), une matière pas encore notée reste "—" pour que
     *  l'admin/le prof voie ce qu'il reste à saisir.
     */
    public function detailModule(Student $student, Module $module, string $anneeScolaire, bool $strict = false): array
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
            if ($moyEc === null && $strict) $moyEc = 0.0;
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
    public function detailSemestre(Student $student, Semestre $semestre, string $anneeScolaire, bool $strict = false): array
    {
        $semestre->loadMissing('modules.matieres');
        $modules = [];
        $creditsObtenus = 0;
        $sommePonderee = 0;
        $sommeCredits = 0;

        foreach ($semestre->modules as $module) {
            $detail = $this->detailModule($student, $module, $anneeScolaire, $strict);
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

    /**
     * Grand tableau de délibération de la classe : un semestre donné, tous les
     * étudiants de son niveau, moyenne+validation par UE, stats de réussite par UE
     * et pour la classe entière. Sert au conseil de classe (vue Admin/Pédagogique).
     */
    public function conseilClasse(Semestre $semestre, string $anneeScolaire): array
    {
        $semestre->loadMissing('modules.matieres', 'license.filiere');

        $etudiants = \App\Models\Student::where('license_id', $semestre->license_id)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get();

        $lignes = [];
        $nbValidesParModule = array_fill(0, $semestre->modules->count(), 0);
        $reussites = 0;
        $mentionsCount = [];

        foreach ($etudiants as $etudiant) {
            $detail = $this->detailSemestre($etudiant, $semestre, $anneeScolaire, true);

            foreach ($detail['modules'] as $i => $mod) {
                if ($mod['valide']) $nbValidesParModule[$i]++;
            }
            if ($detail['valide']) $reussites++;

            $mention = $detail['mention'] ?? 'Insuffisant';
            $mentionsCount[$mention] = ($mentionsCount[$mention] ?? 0) + 1;

            $lignes[] = [
                'student' => $etudiant,
                'modules' => $detail['modules'],
                'moyenne_generale' => $detail['moyenne_generale'],
                'credits_obtenus' => $detail['credits_obtenus'],
                'valide' => $detail['valide'],
                'mention' => $mention,
            ];
        }

        $effectifTotal = $etudiants->count();
        $modulesStats = $semestre->modules->values()->map(function ($mod, $i) use ($nbValidesParModule, $effectifTotal) {
            $nbValides = $nbValidesParModule[$i] ?? 0;
            return [
                'module' => $mod,
                'nb_valides' => $nbValides,
                'pourcentage' => $effectifTotal > 0 ? round($nbValides / $effectifTotal * 100, 2) : 0,
            ];
        });

        $mentionsDistribution = collect($mentionsCount)->map(fn ($count, $mention) => [
            'mention' => $mention,
            'count' => $count,
            'pourcentage' => $effectifTotal > 0 ? round($count / $effectifTotal * 100, 2) : 0,
        ])->values();

        return [
            'semestre' => $semestre,
            'annee_scolaire' => $anneeScolaire,
            'lignes' => $lignes,
            'modules_stats' => $modulesStats,
            'mentions_distribution' => $mentionsDistribution,
            'effectif_total' => $effectifTotal,
            'reussites' => $reussites,
            'taux_reussite' => $effectifTotal > 0 ? round($reussites / $effectifTotal * 100, 2) : 0,
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
