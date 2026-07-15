<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$student = App\Models\Student::latest()->first();
try {
    $dashboardData = [
        'student'         => $student->toArray(),
        'mois_non_payes'  => $student->mois_non_payes,
        'a_jour'          => empty($student->mois_non_payes),
    ];
    echo json_encode($dashboardData, JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
