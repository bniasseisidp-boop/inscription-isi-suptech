<?php

namespace Database\Seeders;

use App\Models\License;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Semestre;
use Illuminate\Database\Seeder;

/**
 * Cursus complet Licence Génie Logiciel (L1 à L3, semestres 1 à 6), saisi
 * depuis les grilles pédagogiques officielles ISI SUPTECH. Idempotent
 * (firstOrCreate/updateOrCreate) — peut être relancé sans dupliquer.
 *
 * À vérifier/ajuster via l'interface Admin ou Accueil Pédagogique une fois en
 * place (certaines heures CM/TP/TD ont pu être mal lues sur les grilles scannées).
 */
class CurriculumGenieLogicielSeeder extends Seeder
{
    public function run(): void
    {
        $filiere = Filiere::where('nom', 'LIKE', '%énie Logiciel%')->first()
            ?? Filiere::where('nom', 'LIKE', '%enie Logiciel%')->first();

        if (!$filiere) {
            $this->command->error('Filière "Génie Logiciel" introuvable.');
            return;
        }

        // Chaque année (L1, L2, L3) est un niveau/tarif séparé dans le catalogue — pas un
        // seul niveau de 3 ans (même règle que pour Réseaux Informatiques).
        $licenceAnnee1 = License::where('filiere_id', $filiere->id)
            ->where('nom', 'NOT LIKE', '%Professionnelle%')
            ->orderBy('id')
            ->first();

        if (!$licenceAnnee1) {
            $this->command->error('Niveau "année 1" introuvable pour Génie Logiciel.');
            return;
        }

        if ($licenceAnnee1->duree_annees != 1) {
            $licenceAnnee1->update(['duree_annees' => 1]);
        }

        $licencesParAnnee = [1 => $licenceAnnee1];
        for ($a = 2; $a <= 3; $a++) {
            $licencesParAnnee[$a] = License::firstOrCreate(
                ['filiere_id' => $filiere->id, 'nom' => "Licence {$a}"],
                [
                    'code'              => $licenceAnnee1->code . '-L' . $a,
                    'duree_annees'      => 1,
                    'mois_debut'        => $licenceAnnee1->mois_debut,
                    'mois_fin'          => $licenceAnnee1->mois_fin,
                    'frais_inscription' => $licenceAnnee1->frais_inscription,
                    'frais_mensuel'     => $licenceAnnee1->frais_mensuel,
                    'actif'             => true,
                ]
            );
        }
        $this->command->info('Niveaux : ' . collect($licencesParAnnee)->map(fn ($l, $a) => "L{$a}=\"{$l->nom}\"")->implode(', '));

        $data = $this->cursus();

        foreach ($data as $annee => $semestres) {
            $license = $licencesParAnnee[$annee];
            foreach ($semestres as $numeroGlobal => $modules) {
                $numero = (($numeroGlobal - 1) % 2) + 1;

                $semestre = Semestre::updateOrCreate(
                    ['license_id' => $license->id, 'numero_global' => $numeroGlobal],
                    ['annee' => $annee, 'numero' => $numero, 'libelle' => "Semestre {$numeroGlobal}", 'credits_requis' => 30]
                );

                foreach ($modules as $ordreModule => $mod) {
                    $module = Module::updateOrCreate(
                        ['semestre_id' => $semestre->id, 'code' => $mod['code']],
                        ['nom' => $mod['nom'], 'credits' => $mod['credits'], 'ordre' => $ordreModule]
                    );

                    foreach ($mod['matieres'] as $ordreMatiere => $mat) {
                        $module->matieres()->updateOrCreate(
                            ['code' => $mat[0]],
                            [
                                'nom' => $mat[1], 'cm' => $mat[2], 'tp' => $mat[3], 'td' => $mat[4],
                                'tpe' => $mat[5], 'vht' => $mat[6], 'coef' => $mat[7], 'ordre' => $ordreMatiere,
                            ]
                        );
                    }
                }
            }
        }

        $this->command->info('Cursus Génie Logiciel (L1-L3, 6 semestres) chargé.');
    }

    /** [code, nom, cm, tp, td, tpe, vht, coef] */
    private function cursus(): array
    {
        return [
            1 => [ // L1
                1 => [ // Semestre 1
                    ['code' => 'APR1101', 'nom' => 'Algorithmique et Programmation', 'credits' => 7, 'matieres' => [
                        ['1APR1101', "Les fondamentaux de l'algorithmique", 20, 0, 28, 32, 80, 4],
                        ['2APR1101', 'Langage C', 20, 16, 0, 24, 60, 4],
                    ]],
                    ['code' => 'TWBD1102', 'nom' => 'Technologie Web et Base de Données', 'credits' => 7, 'matieres' => [
                        ['1TWBD1102', 'Technologie web 1 (HTML/CSS)', 10, 20, 0, 20, 50, 3],
                        ['2TWBD1102', 'Base de données relationnelles 1 (Modélisation)', 10, 0, 20, 20, 50, 2],
                        ['3TWBD1102', 'Versionning (Git, Github)', 10, 14, 0, 16, 40, 2],
                    ]],
                    ['code' => 'ASY1103', 'nom' => 'Architecture et Systèmes', 'credits' => 6, 'matieres' => [
                        ['1ASY1103', 'Architecture', 16, 0, 8, 16, 40, 2],
                        ['2ASY1103', "Système d'exploitation", 16, 0, 8, 16, 40, 2],
                        ['3ASY1103', 'Fondamentaux des réseaux (CCNA1)', 10, 6, 8, 16, 40, 2],
                    ]],
                    ['code' => 'MAP1104', 'nom' => 'Mathématiques Appliquées', 'credits' => 4, 'matieres' => [
                        ['1MAP1104', 'Mathématiques fondamentales', 10, 0, 14, 16, 40, 2],
                        ['2MAP1104', 'Statistiques descriptives', 10, 0, 14, 16, 40, 2],
                    ]],
                    ['code' => 'CGE1105', 'nom' => 'Connaissances Générales', 'credits' => 6, 'matieres' => [
                        ['1CGE1105', 'Anglais 1', 14, 0, 10, 16, 40, 2],
                        ['2CGE1105', 'Outils de productivité personnelle 1', 10, 14, 0, 16, 40, 2],
                        ['3CGE1105', 'Citoyenneté et Développement Personnel', 10, 14, 0, 16, 40, 2],
                    ]],
                ],
                2 => [ // Semestre 2
                    ['code' => 'APR1201', 'nom' => 'Algorithmique et Programmation', 'credits' => 6, 'matieres' => [
                        ['1APR1201', 'Algorithmique', 20, 0, 16, 24, 60, 4],
                        ['2APR1201', 'Langage C 2', 20, 16, 0, 24, 60, 4],
                    ]],
                    ['code' => 'DLO1202', 'nom' => 'Développement Logiciel', 'credits' => 7, 'matieres' => [
                        ['1DLO1202', 'Technologie', 6, 24, 0, 20, 50, 3],
                        ['2DLO1202', 'Conception', 10, 14, 0, 16, 40, 2],
                        ['3DLO1202', 'Python 1', 12, 18, 0, 20, 50, 3],
                    ]],
                    ['code' => 'RSY1203', 'nom' => 'Réseaux et Systèmes', 'credits' => 4, 'matieres' => [
                        ['1RSYI203', 'Système', 12, 12, 0, 16, 40, 2],
                        ['2RSYI203', 'Fondamentaux', 20, 0, 10, 20, 50, 2],
                    ]],
                    ['code' => 'SIBD1204', 'nom' => "Système d'Information et Bases de Données", 'credits' => 7, 'matieres' => [
                        ['1SIBD1204', 'Base de données', 10, 14, 0, 16, 40, 2],
                        ['2SIBD1204', 'Outils de développement', 10, 14, 0, 16, 40, 2],
                        ['3SIBD1204', 'Projet', 8, 12, 0, 16, 40, 3],
                    ]],
                    ['code' => 'CGE1205', 'nom' => 'Connaissances Générales', 'credits' => 6, 'matieres' => [
                        ['1CGE1205', 'Anglais 2', 10, 0, 14, 16, 40, 2],
                        ['2CGE1205', 'Mathématiques', 10, 0, 20, 20, 50, 2],
                        ['3CGE1205', 'Citoyenneté', 10, 14, 0, 16, 40, 2],
                    ]],
                ],
            ],
            2 => [ // L2
                3 => [ // Semestre 3
                    ['code' => 'ALA1301', 'nom' => 'Algorithmique et Programmation', 'credits' => 9, 'matieres' => [
                        ['1ALA1301', 'Algorithmique et structure de données', 10, 0, 26, 24, 60, 4],
                        ['2ALA1301', 'Front-end 1 (React – bases)', 10, 26, 0, 24, 60, 3],
                        ['3ALA1301', 'Java Avancé', 10, 26, 0, 24, 60, 2],
                    ]],
                    ['code' => 'BDIA1302', 'nom' => 'Bases de Données et Intelligence Artificielle', 'credits' => 7, 'matieres' => [
                        ['1BDIA1302', 'Bases de données avancées', 18, 0, 12, 20, 50, 2],
                        ['2BDIA1302', 'Bases de données NoSQL', 10, 10, 10, 20, 50, 3],
                        ['3BDIA1302', "Introduction à l'intelligence artificielle", 12, 12, 0, 16, 40, 2],
                    ]],
                    ['code' => 'SVI1303', 'nom' => 'Systèmes et Virtualisation', 'credits' => 5, 'matieres' => [
                        ['1SVI1303', "Systèmes d'exploitation avancés (Linux)", 10, 20, 0, 20, 50, 3],
                        ['2SVI1303', 'Virtualisation et Conteneurisation', 10, 20, 0, 20, 50, 3],
                    ]],
                    ['code' => 'MAP1304', 'nom' => 'Mathématiques Appliquées', 'credits' => 5, 'matieres' => [
                        ['1MAP1304', 'Logique binaire (Théorie des graphes)', 12, 0, 12, 16, 40, 2],
                        ['2MAP1304', 'Probabilité', 20, 0, 16, 24, 60, 3],
                    ]],
                    ['code' => 'CLE1305', 'nom' => 'Communication et Leadership', 'credits' => 4, 'matieres' => [
                        ['1CLE1305', 'Anglais 3', 10, 0, 14, 16, 40, 2],
                        ['2CLE1305', 'Leadership', 10, 14, 0, 16, 40, 2],
                    ]],
                ],
                4 => [ // Semestre 4
                    ['code' => 'DASE1401', 'nom' => 'Développement Avancé et Systèmes Embarqués', 'credits' => 8, 'matieres' => [
                        ['1DASE1401', 'Systèmes embarqués et IoT', 12, 12, 12, 24, 60, 3],
                        ['2DASE1401', 'Front-end 2 (React avancé)', 10, 20, 0, 20, 50, 3],
                        ['3DASE1401', 'Next.js', 10, 20, 0, 20, 50, 3],
                    ]],
                    ['code' => 'MAP1402', 'nom' => 'Backend Frameworks', 'credits' => 6, 'matieres' => [
                        ['1MAP1402', 'Backend 2 (Spring Boot)', 10, 6, 20, 24, 60, 3],
                        ['2MAP1402', 'Django / FastAPI', 10, 26, 0, 24, 60, 3],
                    ]],
                    ['code' => 'MIAP1403', 'nom' => 'Middleware et API', 'credits' => 4.5, 'matieres' => [
                        ["1MIAP1403", "Conception et Implémentation d'API", 10, 20, 0, 20, 50, 3],
                        ['2MIAP1403', 'Messaging (Kafka, RabbitMQ)', 10, 14, 0, 16, 40, 2],
                    ]],
                    ['code' => 'REQU1404', 'nom' => 'Réseaux et Qualité', 'credits' => 7.5, 'matieres' => [
                        ['1REQU1404', 'Administration réseaux Windows', 10, 26, 0, 24, 60, 2],
                        ['2REQU1404', 'DevOps 1 : CI/CD', 10, 20, 0, 20, 50, 3],
                        ['3REQU1404', 'Qualité logicielle I (théorie, normes)', 18, 6, 0, 16, 40, 2],
                    ]],
                    ['code' => 'COP1405', 'nom' => 'Communication et Projet', 'credits' => 4, 'matieres' => [
                        ['1COP1405', 'Projet intégré S4 (Full Stack avancé)', 14, 10, 0, 16, 40, 2],
                        ['2COP1405', 'Anglais 4', 14, 10, 0, 16, 40, 2],
                    ]],
                ],
            ],
            3 => [ // L3
                5 => [ // Semestre 5
                    ['code' => 'ALO1501', 'nom' => 'Architecture Logicielle', 'credits' => 8, 'matieres' => [
                        ['1ALO1501', 'Architecture logicielle distribuée', 16, 20, 0, 24, 60, 3],
                        ['2ALO1501', 'Microservices', 16, 20, 0, 24, 60, 3],
                        ['3ALO1501', "Intégration d'applications SOA", 12, 12, 0, 16, 40, 2],
                    ]],
                    ['code' => 'DAV1502', 'nom' => 'Développement Avancé', 'credits' => 6, 'matieres' => [
                        ['1DAV1502', 'Frontend avancé (Performance / SSR)', 10, 20, 0, 20, 50, 3],
                        ['2DAV1502', 'Développement mobile (React Native)', 10, 32, 0, 28, 70, 3],
                    ]],
                    ['code' => 'DECL1503', 'nom' => 'DevOps et Cloud', 'credits' => 6, 'matieres' => [
                        ['1DECL1503', 'DevOps II (Kubernetes, Terraform)', 16, 20, 0, 24, 60, 3],
                        ['2DECL1503', 'Cloud (AWS, Azure)', 10, 26, 0, 24, 60, 3],
                    ]],
                    ['code' => 'SEQU1504', 'nom' => 'Sécurité et Qualité Logicielle', 'credits' => 5, 'matieres' => [
                        ['1SEQU1504', 'Sécurité applicative (OWASP)', 10, 20, 0, 20, 50, 3],
                        ['2SEQU21504', 'Qualité logicielle II (outils SonarQube)', 10, 20, 0, 20, 50, 2],
                    ]],
                    ['code' => 'PRO1505', 'nom' => 'Professionnalisation', 'credits' => 5, 'matieres' => [
                        ['1PRO1505', 'Gestion de projet Agile', 10, 0, 14, 16, 40, 2],
                        ['2PRO1505', "Entreprenariat et techniques de recherche d'emploi", 16, 0, 20, 24, 60, 3],
                    ]],
                ],
                6 => [ // Semestre 6
                    ['code' => 'DAP1601', 'nom' => 'IA et Cloud', 'credits' => 8, 'matieres' => [
                        ['1DAP1601', 'Outils IA pour le développement (GitHub Copilot)', 10, 20, 0, 20, 50, 3],
                        ['2DAP1601', 'Scaling avancé (Serverless)', 10, 20, 0, 20, 50, 2],
                        ['3DAP1601', 'Cloud avancé', 6, 30, 0, 24, 60, 3],
                    ]],
                    ['code' => 'PRO1602', 'nom' => 'Professionnalisation', 'credits' => 22, 'matieres' => [
                        ['1PRO1602', 'Méthodologie de rédaction de mémoire', 14, 0, 10, 16, 40, 2],
                        ['2PRO1602', 'Stage en entreprise ou projet tutoré, Rédaction et Soutenance de Mémoire', 0, 0, 0, 416, 440, 3],
                    ]],
                ],
            ],
        ];
    }
}
