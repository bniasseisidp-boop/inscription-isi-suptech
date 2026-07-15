<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('email', 'like', '%')->latest()->first();
if ($user && !\App\Models\Student::where('user_id', $user->id)->exists()) {
    echo "Deleting orphaned user: " . $user->email . "\n";
    $user->delete();
} else {
    echo "No orphaned users found.\n";
}
