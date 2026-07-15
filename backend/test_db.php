<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$student = App\Models\Student::latest()->first();
if ($student) {
    echo json_encode($student->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "No students found.\n";
}
