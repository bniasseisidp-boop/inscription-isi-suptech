<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Crée (ou met à jour) uniquement le compte super admin — n'importe pas les
 * comptes de test ni les filières du DatabaseSeeder principal. Les identifiants
 * sont lus depuis .env pour ne jamais committer de mot de passe réel dans git.
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('SUPERADMIN_EMAIL');
        $password = env('SUPERADMIN_PASSWORD');

        if (!$email || !$password) {
            $this->command->error('Définissez SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD dans .env avant de lancer ce seeder.');
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => 'Super Admin',
                'password' => $password,
                'role'     => 'super_admin',
                'actif'    => true,
            ]
        );

        $this->command->info("Super admin créé/à jour : {$email}");
    }
}
