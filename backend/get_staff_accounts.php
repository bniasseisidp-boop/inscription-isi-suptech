<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== COMPTES ADMINISTRATEURS & STAFF (ISI-SUPTECH) ===" . PHP_EOL . PHP_EOL;
$staff = \App\Models\User::whereIn('role', ['admin', 'super_admin', 'pedagogique', 'caissier', 'caisse', 'agent_scolarite'])->get();

foreach ($staff as $u) {
    echo "• Rôle : [" . strtoupper($u->role) . "]" . PHP_EOL;
    echo "  Nom   : " . $u->name . PHP_EOL;
    echo "  Email : " . $u->email . PHP_EOL;
    echo "  ID    : #" . $u->id . PHP_EOL . PHP_EOL;
}
