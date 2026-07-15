<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::latest()->first();
if ($user) {
    echo json_encode($user->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "No users found.\n";
}
