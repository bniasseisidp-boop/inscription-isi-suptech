<?php

namespace Database\Seeders;

use App\Models\Filiere;
use App\Models\License;
use Illuminate\Database\Seeder;

/**
 * Catalogue réel des filières & niveaux (tarifs brochure ISI SUPTECH) — sans
 * les comptes de test du DatabaseSeeder principal. C'est de la vraie donnée
 * métier, nécessaire pour que la pré-inscription fonctionne en production.
 * firstOrCreate() partout : peut être relancé sans dupliquer ni écraser des
 * tarifs déjà modifiés depuis l'admin.
 */
class CatalogueSeeder extends Seeder
{
    public function run(): void
    {
        $bt        = ['duree_annees' => 3, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 220000, 'frais_mensuel' => 70000];
        $dts       = ['duree_annees' => 2, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 220000, 'frais_mensuel' => 70000];
        $licProInfo   = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 210000, 'frais_mensuel' => 90000];
        $licProGest   = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 210000, 'frais_mensuel' => 90000];
        $licProLigne  = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 250000, 'frais_mensuel' => 120000];
        $masterProGL  = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 250000, 'frais_mensuel' => 120000];
        $masterProFin = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 250000, 'frais_mensuel' => 100000];
        $masterProLigne = ['duree_annees' => 1, 'mois_debut' => 9, 'mois_fin' => 6, 'frais_inscription' => 235000, 'frais_mensuel' => 100000];

        $catalogue = [
            // ── Département Informatique ──────────────────────────────────
            ['nom' => 'Informatique', 'code' => 'INF-GEN', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($bt, ['nom' => 'Brevet de Technicien (BT)', 'code' => 'BT']),
            ]],
            ['nom' => 'Informatique de Gestion', 'code' => 'INF-IG', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS - BTS - Licence', 'code' => 'DTS']),
            ]],
            ['nom' => 'Infographie', 'code' => 'INF-INFO', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS - BTS - Licence', 'code' => 'DTS']),
            ]],
            ['nom' => 'Web Master', 'code' => 'INF-WEB', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS - BTS - Licence', 'code' => 'DTS']),
            ]],
            ['nom' => 'Réseaux Informatiques', 'code' => 'INF-RI', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS - BTS - Licence', 'code' => 'DTS']),
                array_merge($licProInfo, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
                array_merge($licProLigne, ['nom' => 'Licence Professionnelle (en ligne)', 'code' => 'LICPRO-LIGNE']),
            ]],
            ['nom' => 'Génie Logiciel', 'code' => 'INF-GL', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS - BTS - Licence', 'code' => 'DTS']),
                array_merge($licProInfo, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
                array_merge($masterProGL, ['nom' => 'Master Professionnel', 'code' => 'MASTERPRO']),
                array_merge($licProLigne, ['nom' => 'Licence Professionnelle (en ligne)', 'code' => 'LICPRO-LIGNE']),
                array_merge($masterProLigne, ['nom' => 'Master Professionnel (en ligne)', 'code' => 'MASTERPRO-LIGNE']),
            ]],
            ['nom' => 'Infographie Multimédia', 'code' => 'INF-IM', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($licProInfo, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Informatique Appliquée à la Gestion des Entreprises', 'code' => 'INF-IAGE', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($licProInfo, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Réseaux Télécommunications', 'code' => 'INF-RT', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($masterProGL, ['nom' => 'Master Professionnel', 'code' => 'MASTERPRO']),
            ]],
            ['nom' => 'Réseaux et Systèmes Informatiques', 'code' => 'INF-RSI', 'description' => 'Département Informatique', 'licenses' => [
                array_merge($masterProLigne, ['nom' => 'Master Professionnel (en ligne)', 'code' => 'MASTERPRO-LIGNE']),
            ]],

            // ── Département Gestion ───────────────────────────────────────
            ['nom' => 'Comptabilité', 'code' => 'GES-COMPTA', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($bt, ['nom' => 'Brevet de Technicien (BT)', 'code' => 'BT']),
            ]],
            ['nom' => 'Commerce International', 'code' => 'GES-CI', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Secrétariat Bureautique', 'code' => 'GES-SB', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
            ]],
            ['nom' => 'Comptabilité Finance', 'code' => 'GES-CF', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
                array_merge($licProLigne, ['nom' => 'Licence Professionnelle (en ligne)', 'code' => 'LICPRO-LIGNE']),
            ]],
            ['nom' => 'Marketing Digital', 'code' => 'GES-MD', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Transport Logistique', 'code' => 'GES-TL', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Secrétariat Juridique', 'code' => 'GES-SJ', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($dts, ['nom' => 'DTS', 'code' => 'DTS']),
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Assistanat de Direction', 'code' => 'GES-AD', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($licProGest, ['nom' => 'Licence Professionnelle', 'code' => 'LICPRO']),
            ]],
            ['nom' => 'Finance', 'code' => 'GES-FIN', 'description' => 'Département Gestion', 'licenses' => [
                array_merge($masterProFin, ['nom' => 'Master Professionnel', 'code' => 'MASTERPRO']),
                array_merge($masterProLigne, ['nom' => 'Master Professionnel (en ligne)', 'code' => 'MASTERPRO-LIGNE']),
            ]],
        ];

        foreach ($catalogue as $f) {
            $filiere = Filiere::firstOrCreate(
                ['code' => $f['code']],
                ['nom' => $f['nom'], 'code' => $f['code'], 'description' => $f['description']]
            );
            foreach ($f['licenses'] as $l) {
                $code = $f['code'] . '-' . $l['code'];
                License::firstOrCreate(
                    ['code' => $code],
                    array_merge($l, ['filiere_id' => $filiere->id, 'code' => $code])
                );
            }
        }

        $this->command->info('✅ Catalogue filières & niveaux créé (' . count($catalogue) . ' filières).');
    }
}
