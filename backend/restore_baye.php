<?php

// Standalone restoration script for Baye Assane NIASSE
// Usable via CLI: php restore_baye.php
// Or via Browser: https://api.isisuptech.com/restore_baye.php

$backendDir = __DIR__;
if (!file_exists($backendDir . '/vendor/autoload.php')) {
    $backendDir = __DIR__ . '/../backend';
}
if (!file_exists($backendDir . '/vendor/autoload.php')) {
    $backendDir = '/home/c2710036c/isisuptech-backend/backend';
}

require $backendDir . '/vendor/autoload.php';
$app = require_once $backendDir . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Models\Student;
use App\Models\User;
use App\Models\Filiere;
use App\Models\License;
use App\Models\Payment;

header('Content-Type: text/plain; charset=utf-8');
echo "=== RESTAURATION CLEAN DE BAYE ASSANE NIASSE ===\n\n";

$jsonPath = __DIR__ . '/baye_data.json';
if (!file_exists($jsonPath)) {
    $jsonPath = dirname(__DIR__) . '/backend/baye_data.json';
}
if (!file_exists($jsonPath)) {
    echo "Fichier baye_data.json introuvable.\n";
    exit(1);
}

$data = json_decode(file_get_contents($jsonPath), true);
if (!$data) {
    echo "Erreur de decodage du JSON.\n";
    exit(1);
}

echo "1. Recherche de la filiere et de la classe...\n";
$filiere = Filiere::where('nom', 'LIKE', '%Reseaux%')->orWhere('nom', 'LIKE', '%Réseaux%')->first();
if (!$filiere) {
    $filiere = Filiere::firstOrCreate([
        'code' => 'RI',
    ], [
        'nom' => 'Réseaux Informatiques',
        'description' => 'Filière Réseaux Informatiques & Télécoms'
    ]);
}

$license = License::where('filiere_id', $filiere->id)->where(function($q) {
    $q->where('nom', 'LIKE', '%L2%')->orWhere('nom', 'LIKE', '%Licence 2%');
})->first();
if (!$license) {
    $license = License::where('filiere_id', $filiere->id)->first();
}
if (!$license) {
    $license = License::firstOrCreate([
        'filiere_id' => $filiere->id,
        'nom' => 'Licence 2 (L2) - Réseaux Informatiques'
    ], [
        'code' => 'L2-RI',
        'frais_inscription' => 150000,
        'frais_reinscription' => 90000,
        'mensualite' => 70000,
        'duree_mois' => 9,
        'annee_scolaire' => '2025-2026',
        'est_actif' => true
    ]);
}
echo "   Filiere: " . $filiere->nom . " (ID: " . $filiere->id . ")\n";
echo "   Classe: " . $license->nom . " (ID: " . $license->id . ")\n\n";

echo "2. Creation / Mise a jour du compte utilisateur d'abord...\n";
$userEmail = 'azotobrain7@gmail.com';
$user = User::where('email', $userEmail)->first();
if ($user) {
    $user->update([
        'name'     => 'Baye Assane NIASSE',
        'email'    => $userEmail,
        'password' => Hash::make('password123'),
        'role'     => 'student'
    ]);
    echo "   -> Utilisateur existant (ID: " . $user->id . ") mis a jour avec email: " . $userEmail . " et mdp: password123\n";
} else {
    $user = User::create([
        'name'     => 'Baye Assane NIASSE',
        'email'    => $userEmail,
        'password' => Hash::make('password123'),
        'role'     => 'student'
    ]);
    echo "   -> Nouvel utilisateur cree (ID: " . $user->id . ") avec email: " . $userEmail . " et mdp: password123\n";
}

echo "\n3. Recherche / Restauration de l'etudiant...\n";
$matricule = $data['matricule'] ?? '411-25-1245/ISI SUPTECH';
$student = Student::withTrashed()->where('matricule', $matricule)->first();
if (!$student) {
    $student = Student::withTrashed()->where('nom', 'NIASSE')->where('prenom', 'Baye Assane')->first();
}
if ($student && method_exists($student, 'trashed') && $student->trashed()) {
    $student->restore();
    echo "   -> Etudiant restaure depuis la corbeille (SoftDeletes).\n";
}

$historique = $data['dossiers_historique'] ?? [];
$studentFields = [
    'user_id'                => $user->id,
    'matricule'              => $matricule,
    'nom'                    => 'NIASSE',
    'prenom'                 => 'Baye Assane',
    'sexe'                   => 'M',
    'date_naissance'         => '2005-03-10',
    'lieu_naissance'         => 'Kaolack',
    'nationalite'            => 'Sénégalaise',
    'pays_residence'         => 'Sénégal',
    'telephone'              => '78 456 78 93',
    'tuteur_telephone'       => '77 270 23 28',
    'email'                  => $userEmail,
    'adresse'                => 'Golf Sud',
    'filiere_id'             => $filiere->id,
    'license_id'             => $license->id,
    'niveau_entree'          => 'Licence 1',
    'annee_scolaire'         => '2025-2026',
    'statut_inscription'     => 'accepte',
    'inscription_payee'      => true,
    'frais_scolarite_total'  => 780000,
    'compta_debit_total'     => 780000,
    'compta_total_paye'      => 780000,
    'compta_solde_restant'   => 0,
    'compta_est_en_regle'    => true,
    'moyenne_generale'       => 16.35,
    'credits_total'          => 60,
    'dossiers_historique'    => $historique,
    'notes_admin'            => 'Etudiant reimporte / restaure propre. Pret pour test reinscription 2026-2027.'
];

if ($student) {
    $student->update($studentFields);
    echo "   -> Etudiant existant mis a jour (ID: " . $student->id . ").\n";
} else {
    $student = Student::create($studentFields);
    echo "   -> Etudiant recree avec succes (ID: " . $student->id . ").\n";
}

echo "\n4. Nettoyage et Restauration des paiements historiques...\n";
if (Schema::hasColumn('payments', 'annee')) {
    Payment::where('student_id', $student->id)->where('annee', '2026-2027')->delete();
} elseif (Schema::hasColumn('payments', 'annee_scolaire')) {
    Payment::where('student_id', $student->id)->where('annee_scolaire', '2026-2027')->delete();
}

$existingPaymentsCount = Payment::where('student_id', $student->id)->count();
if ($existingPaymentsCount == 0 && !empty($data['paiements'])) {
    foreach ($data['paiements'] as $p) {
        $pDate = isset($p['date']) ? \Carbon\Carbon::createFromFormat('d/m/Y', $p['date']) : now();
        $paymentData = [
            'student_id'     => $student->id,
            'type'           => strtolower($p['nature'] ?? 'mensualite') === 'inscription' ? 'inscription' : 'mensualite',
            'montant'        => floatval($p['montant'] ?? 0),
            'mois'           => $p['mois'] ?? null,
            'methode'        => 'espece',
            'statut'         => 'complete',
            'date_paiement'  => $pDate,
            'created_at'     => $pDate,
            'notes'          => 'Paiement historique importe (' . ($p['num_piece'] ?? '') . ')',
        ];
        if (Schema::hasColumn('payments', 'annee')) {
            $paymentData['annee'] = '2024-2025';
        }
        if (Schema::hasColumn('payments', 'annee_scolaire')) {
            $paymentData['annee_scolaire'] = '2024-2025';
        }
        Payment::create($paymentData);
    }
    echo "   -> " . count($data['paiements']) . " paiements historiques (2024-2025) restaures.\n";
} else {
    echo "   -> " . $existingPaymentsCount . " paiements deja presents pour cet etudiant.\n";
}

echo "\n======================================================\n";
echo "SUCCES ! Baye Assane NIASSE est 100% restaure et pret !\n";
echo "Matricule : " . $student->matricule . "\n";
echo "Email     : " . $user->email . "\n";
echo "Mot de passe test : password123\n";
echo "Annee actuelle    : 2025-2026 (Pret pour reinscription 2026-2027)\n";
echo "======================================================\n";
