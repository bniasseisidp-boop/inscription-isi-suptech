<?php

namespace Database\Seeders;

use App\Models\License;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Semestre;
use Illuminate\Database\Seeder;

/**
 * Cursus complet Licence Réseaux Informatiques (L1 à L3, semestres 1 à 6),
 * saisi depuis les grilles pédagogiques officielles ISI SUPTECH. Idempotent
 * (firstOrCreate/updateOrCreate) — peut être relancé sans dupliquer.
 *
 * À vérifier/ajuster via l'interface Admin ou Accueil Pédagogique une fois en
 * place (certaines heures CM/TP/TD ont pu être mal lues sur les grilles scannées).
 */
class CurriculumReseauxInformatiquesSeeder extends Seeder
{
    public function run(): void
    {
        $filiere = Filiere::where('nom', 'LIKE', '%éseaux Informatiques%')->first()
            ?? Filiere::where('nom', 'LIKE', '%eseaux Informatiques%')->first();

        if (!$filiere) {
            $this->command->error('Filière "Réseaux Informatiques" introuvable.');
            return;
        }

        // Le nom exact du niveau "cycle de base" (DTS-BTS-Licence, Licence 1...) varie
        // selon l'environnement — on prend celui qui n'est PAS une "Licence Professionnelle"
        // (cycle court d'1 an, différent du cycle long de 3 ans qu'on cherche ici).
        $license = License::where('filiere_id', $filiere->id)
            ->where('nom', 'NOT LIKE', '%Professionnelle%')
            ->orderBy('id')
            ->first();

        if (!$license) {
            $this->command->error('Niveau "cycle de base" introuvable pour Réseaux Informatiques.');
            return;
        }

        // Le cursus va jusqu'à L3 (semestre 6) — on aligne la durée du niveau.
        if ($license->duree_annees != 3) {
            $license->update(['duree_annees' => 3]);
        }

        $data = $this->cursus();

        foreach ($data as $annee => $semestres) {
            foreach ($semestres as $numeroGlobal => $modules) {
                // Les clés du tableau sont deja les numeros de semestre absolus (1 a 6).
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

        $this->command->info('Cursus Réseaux Informatiques (L1-L3, 6 semestres) chargé.');
    }

    /** [code, nom, cm, tp, td, tpe, vht, coef] */
    private function cursus(): array
    {
        return [
            1 => [ // L1
                1 => [ // Semestre 1
                    ['code' => 'MIN 1101', 'nom' => 'Mathématiques et Informatique', 'credits' => 6, 'matieres' => [
                        ['1MIN 1101', 'Algorithmique 1', 16, 0, 8, 16, 40, 3],
                        ['2MIN 1101', 'Programmation 1 (Langage C)', 16, 8, 0, 16, 40, 2],
                        ['3MIN 1101', 'Analyse', 16, 0, 8, 16, 40, 2],
                    ]],
                    ['code' => 'RAR 1102', 'nom' => 'Réseaux et Architecture', 'credits' => 8, 'matieres' => [
                        ['1RAR 1102', 'Fondamentaux des réseaux 1 (CCNA1)', 16, 12, 16, 16, 60, 3],
                        ['2RAR 1102', 'Systèmes d\'Exploitations de base 1', 16, 8, 0, 16, 40, 2],
                        ['3RAR 1102', 'Architecture et composants des ordinateurs', 24, 0, 12, 24, 60, 3],
                    ]],
                    ['code' => 'PHY 1103', 'nom' => 'Physique', 'credits' => 4, 'matieres' => [
                        ['1PHY 1103', 'Electricité 1', 8, 16, 0, 16, 40, 2],
                        ['2PHY 1103', 'Electronique Analogique', 14, 10, 0, 16, 40, 2],
                    ]],
                    ['code' => 'SIN 1104', 'nom' => 'Systèmes d\'Information', 'credits' => 6, 'matieres' => [
                        ['1SIN 1104', 'Système de gestion de bases de données (SGBD)', 20, 0, 16, 24, 60, 2],
                        ['2SIN 1104', 'Technologies Web 1 (HTML, CSS, JAVASCRIPT)', 20, 16, 0, 24, 60, 2],
                    ]],
                    ['code' => 'CGE 1105', 'nom' => 'Connaissances Générales', 'credits' => 6, 'matieres' => [
                        ['1CGE 1105', 'Outils numériques et IA générative', 8, 0, 12, 20, 40, 1],
                        ['2CGE 1105', 'Leadership & Développement Personnel 1', 16, 8, 0, 16, 40, 1],
                        ['3CGE 1105', 'Anglais 1 (TOIEC)', 14, 0, 18, 18, 40, 1],
                    ]],
                ],
                2 => [ // Semestre 2
                    ['code' => 'MIN 1201', 'nom' => 'Mathématique et Informatique', 'credits' => 6, 'matieres' => [
                        ['1MIN 1201', 'Algorithmique 2', 16, 0, 8, 16, 40, 3],
                        ['2MIN 1201', 'Programmation 2 (Langage C)', 16, 0, 8, 16, 40, 2],
                        ['3MIN 1201', 'Algèbre', 16, 8, 0, 16, 40, 2],
                    ]],
                    ['code' => 'RAR 1202', 'nom' => 'Réseaux et Architecture', 'credits' => 8, 'matieres' => [
                        ['1RAR 1202', 'Fondamentaux des réseaux 2 (CCNA1)', 16, 12, 16, 16, 60, 3],
                        ['2RAR 1202', 'Systèmes d\'Exploitations 2', 12, 8, 10, 10, 40, 2],
                        ['3RAR 1202', 'Maintenance Informatique (IT Essentiels)', 16, 12, 16, 16, 60, 3],
                    ]],
                    ['code' => 'PHY 1203', 'nom' => 'Physique', 'credits' => 4, 'matieres' => [
                        ['1PHY 1203', 'Electricité 2', 16, 14, 0, 10, 40, 2],
                        ['2PHY 1203', 'Electronique numérique', 16, 14, 0, 10, 40, 2],
                    ]],
                    ['code' => 'SIN 1204', 'nom' => 'Systèmes d\'Information', 'credits' => 6, 'matieres' => [
                        ['1SIN 1204', 'Base de données (SQL/NoSQL)', 14, 0, 16, 30, 60, 2],
                        ['2SIN 1204', 'Technologies Web 2 (HTML, CSS, JAVASCRIPT)', 16, 14, 0, 30, 60, 2],
                    ]],
                    ['code' => 'CGE 1205', 'nom' => 'Connaissances Générales', 'credits' => 6, 'matieres' => [
                        ['1CGE 1205', 'Bureautique', 8, 12, 0, 20, 40, 1],
                        ['2CGE 1205', 'Technique d\'expression écrite et orale', 16, 8, 0, 16, 40, 1],
                        ['3CGE 1205', 'Anglais 2 (TOIEC)', 14, 8, 0, 18, 40, 1],
                    ]],
                ],
            ],
            2 => [ // L2
                3 => [ // Semestre 3
                    ['code' => 'PLA 1301', 'nom' => 'Programmation et Langage', 'credits' => 7, 'matieres' => [
                        ['1PLA 1301', 'Programmation Orientée Objet (Java)', 12, 24, 0, 24, 60, 2],
                        ['2PLA 1301', 'Analyse et conception (UML)', 16, 0, 12, 12, 40, 2],
                        ['3PLA 1301', 'Programmation Python 1 (Python Essentiel)', 12, 16, 0, 12, 40, 2],
                    ]],
                    ['code' => 'RAR 1302', 'nom' => 'Réseaux et Architecture', 'credits' => 7, 'matieres' => [
                        ['1RAR 1302', 'Architectures et Technologies des réseaux sans fil', 12, 24, 0, 24, 60, 3],
                        ['2RAR 1302', 'Routage et commutation 1 (CISCO/HUAWEI)', 20, 20, 0, 40, 80, 3],
                    ]],
                    ['code' => 'SYS 1303', 'nom' => 'Systèmes', 'credits' => 6, 'matieres' => [
                        ['1SYS 1303', 'Administration Windows Server 1', 12, 24, 0, 24, 60, 3],
                        ['3SYS 1303', 'Administration Système Linux 1', 12, 24, 0, 24, 60, 3],
                    ]],
                    ['code' => 'MAT 1304', 'nom' => 'Mathématiques', 'credits' => 6, 'matieres' => [
                        ['1MAT 1304', 'Théorie des graphes', 12, 16, 8, 24, 60, 2],
                        ['2MAT 1304', 'Probabilités et statistiques', 20, 0, 16, 24, 60, 2],
                    ]],
                    ['code' => 'CGE 1305', 'nom' => 'Connaissances Générales', 'credits' => 4, 'matieres' => [
                        ['1CGE 1305', 'Techniques de recherche d\'emploi', 14, 0, 10, 16, 40, 2],
                        ['2CGE 1305', 'Anglais 3 (TOIEC)', 14, 0, 10, 16, 40, 1],
                    ]],
                ],
                4 => [ // Semestre 4
                    ['code' => 'PLA 1401', 'nom' => 'Programmation et Langage', 'credits' => 6, 'matieres' => [
                        ['1PLA 1401', 'Programmation Python 2 (Python Essentiel 2)', 20, 0, 16, 24, 60, 2],
                        ['2PLA 1401', 'Recherche Opérationnelle Appliquée', 20, 16, 0, 24, 60, 2],
                    ]],
                    ['code' => 'RSE 1402', 'nom' => 'Réseaux et Sécurité', 'credits' => 6, 'matieres' => [
                        ['1RSE 1402', 'Routage et commutation 2 (CISCO/HUAWEI)', 8, 16, 0, 16, 40, 3],
                        ['2RSE 1402', 'Téléphonie sur IP (Architectures, Protocoles et Produits)', 16, 8, 0, 16, 40, 2],
                        ['3RSE 1402', 'Fondamentaux de la sécurité informatique', 16, 8, 0, 16, 40, 2],
                    ]],
                    ['code' => 'SYS 1403', 'nom' => 'Systèmes', 'credits' => 6, 'matieres' => [
                        ['1SYS 1403', 'Administration Windows Server 2', 12, 12, 0, 16, 40, 2],
                        ['2SYS 1403', 'Virtualisation des systèmes informatiques', 12, 12, 0, 16, 40, 2],
                        ['3SYS 1403', 'Administration Système Linux 2', 12, 12, 0, 16, 40, 3],
                    ]],
                    ['code' => 'IAI 1404', 'nom' => 'Intelligence Artificielle et Internet des Objets', 'credits' => 4, 'matieres' => [
                        ['1IAI 1404', 'Intelligence Artificielle', 12, 12, 0, 16, 40, 2],
                        ['2IAI 1404', 'Internet des Objets', 12, 12, 0, 16, 40, 2],
                    ]],
                    ['code' => 'SIN 1405', 'nom' => 'Systèmes d\'Information', 'credits' => 4, 'matieres' => [
                        ['1SIN 1405', 'Administration de base de données', 12, 12, 0, 16, 40, 2],
                        ['2SIN 1405', 'Technologies Web (Framework)', 12, 0, 12, 16, 40, 2],
                    ]],
                    ['code' => 'CGE 1406', 'nom' => 'Connaissances Générales', 'credits' => 4, 'matieres' => [
                        ['1CGE 1406', 'Anglais 4 (TOIEC)', 12, 12, 0, 16, 40, 1],
                        ['2CGE 1406', 'Droits des TIC', 12, 12, 0, 16, 40, 1],
                    ]],
                ],
            ],
            3 => [ // L3
                5 => [ // Semestre 5
                    ['code' => 'RSE 1501', 'nom' => 'Réseaux et Sécurité', 'credits' => 6, 'matieres' => [
                        ['1RSE 1501', 'Sécurité des systèmes et réseaux', 12, 24, 0, 24, 60, 2],
                        ['2RSE 1501', 'Supervision des systèmes et réseaux', 12, 24, 0, 24, 60, 2],
                    ]],
                    ['code' => 'RSY 1502', 'nom' => 'Réseaux et Systèmes', 'credits' => 8.1, 'matieres' => [
                        ['1RSY 1502', 'Programmation Réseau (DevNet)', 12, 18, 0, 10, 40, 3],
                        ['2RSY 1502', 'Communication unifiée (Voix, Données et vidéos)', 18, 18, 0, 26, 62, 2],
                        ['3RSY 1502', 'Routage et commutation avancés (CISCO et HUAWEI)', 18, 18, 0, 24, 60, 3],
                    ]],
                    ['code' => 'VCL 1503', 'nom' => 'Virtualisation et Cloud', 'credits' => 8, 'matieres' => [
                        ['1VCL 1503', 'Automatisation et scripting', 12, 16, 0, 12, 40, 2],
                        ['2VCL 1503', 'Cloud Computing (Openstack/AWS/AZURE)', 18, 18, 0, 24, 60, 3],
                        ['3VCL 1503', 'DevOps (Provisioning et configuration management pipeline CI/CD)', 18, 18, 0, 24, 60, 2],
                    ]],
                    ['code' => 'TEM 1504', 'nom' => 'Technologies Émergentes', 'credits' => 4, 'matieres' => [
                        ['1TEM 1504', 'IoT et Systèmes embarqués', 12, 12, 0, 16, 40, 2],
                        ['2TEM 1504', 'IA pour les réseaux', 12, 12, 0, 16, 40, 2],
                    ]],
                    ['code' => 'ASS 1505', 'nom' => 'Administration Système et Services', 'credits' => 4, 'matieres' => [
                        ['1ASS 1505', 'Administration de bases de données (Oracle...)', 8, 0, 12, 20, 40, 1],
                        ['2ASS 1505', 'Administration de services réseaux', 12, 0, 8, 20, 40, 1],
                    ]],
                ],
                6 => [ // Semestre 6
                    ['code' => 'CGE 1601', 'nom' => 'Connaissances Générales', 'credits' => 6, 'matieres' => [
                        ['1CGE 1601', 'Entreprenariat', 12, 12, 0, 16, 40, 2],
                        ['2CGE 1601', 'Communication Professionnelle d\'entreprise', 12, 12, 0, 16, 40, 2],
                        ['3CGE 1601', 'Gestion de projet informatique (Asile)', 12, 12, 0, 16, 40, 2],
                    ]],
                    ['code' => 'PRO 1602', 'nom' => 'Professionnalisation', 'credits' => 24, 'matieres' => [
                        ['1PRO 1602', 'Méthodologie de rédaction de mémoire (MRM)', 10, 10, 10, 10, 40, 2],
                        ['2PRO 1602', 'Stage, Rédaction et Soutenance de Mémoire', 0, 0, 0, 440, 440, 3],
                    ]],
                ],
            ],
        ];
    }
}
