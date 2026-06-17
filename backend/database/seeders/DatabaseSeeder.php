<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Filiere;
use App\Models\License;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin account ───────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@isisuptech.com'],
            [
                'name'     => 'Administrateur ISI',
                'password' => Hash::make('Admin@2025!'),
                'role'     => 'admin',
                'actif'    => true,
            ]
        );

        // ── Cashier account ─────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'caisse@isisuptech.com'],
            [
                'name'     => 'Service Caisse',
                'password' => Hash::make('Caisse@2025!'),
                'role'     => 'cashier',
                'actif'    => true,
            ]
        );

        // ── Accueil account ─────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'accueil@isisuptech.com'],
            [
                'name'     => 'Service Accueil',
                'password' => Hash::make('Accueil@2025!'),
                'role'     => 'accueil',
                'actif'    => true,
            ]
        );

        // ── Filières ────────────────────────────────────────────────────────
        $filieres = [
            ['nom' => 'Informatique & Systèmes', 'code' => 'INFO', 'description' => 'Systèmes d\'information, bases de données, programmation avancée.'],
            ['nom' => 'Réseaux & Télécommunications', 'code' => 'RT', 'description' => 'Infrastructure réseau, protocoles, cloud computing.'],
            ['nom' => 'Intelligence Artificielle', 'code' => 'IA', 'description' => 'Machine learning, deep learning, traitement du langage naturel.'],
            ['nom' => 'Cybersécurité', 'code' => 'CYBER', 'description' => 'Sécurité offensive et défensive, audit, forensique.'],
            ['nom' => 'Développement Web & Mobile', 'code' => 'DWM', 'description' => 'Applications web modernes, mobile natif et cross-platform.'],
            ['nom' => 'Génie Logiciel', 'code' => 'GL', 'description' => 'Méthodes agiles, DevOps, architecture microservices.'],
        ];

        $licenses = [
            ['nom' => 'Licence 1', 'code' => 'L1', 'duree_annees' => 1, 'frais_inscription' => 150000, 'frais_mensuel' => 45000],
            ['nom' => 'Licence 2', 'code' => 'L2', 'duree_annees' => 1, 'frais_inscription' => 150000, 'frais_mensuel' => 50000],
            ['nom' => 'Licence 3', 'code' => 'L3', 'duree_annees' => 1, 'frais_inscription' => 150000, 'frais_mensuel' => 55000],
            ['nom' => 'Master 1', 'code' => 'M1', 'duree_annees' => 1, 'frais_inscription' => 200000, 'frais_mensuel' => 70000],
            ['nom' => 'Master 2', 'code' => 'M2', 'duree_annees' => 1, 'frais_inscription' => 200000, 'frais_mensuel' => 75000],
        ];

        foreach ($filieres as $f) {
            $filiere = Filiere::firstOrCreate(['code' => $f['code']], $f);
            foreach ($licenses as $l) {
                License::firstOrCreate(
                    ['code' => $f['code'] . '-' . $l['code']],
                    array_merge($l, [
                        'filiere_id' => $filiere->id,
                        'code'       => $f['code'] . '-' . $l['code'],
                    ])
                );
            }
        }

        $this->command->info('✅ Données de démonstration créées !');
        $this->command->info('Admin: admin@isisuptech.com / Admin@2025!');
        $this->command->info('Caisse: caisse@isisuptech.com / Caisse@2025!');
        $this->command->info('Accueil: accueil@isisuptech.com / Accueil@2025!');
    }
}
