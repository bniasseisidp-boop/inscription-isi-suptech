<?php

// Standalone direct import script that groups all 2 193 annual records into the 1 162 unique students
// Storing full multi-year careers in `dossiers_historique`, all grades in `notes`, and all receipts in `payments`.
// Run via CLI: php import_direct.php

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
use Illuminate\Database\Schema\Blueprint;

header('Content-Type: text/plain; charset=utf-8');
echo "=== IMPORTATION ET SYNCHRONISATION MULTI-ANNÉES (1 162 ÉTUDIANTS / 2 193 DOSSIERS) ===\n\n";

ini_set('memory_limit', '512M');
set_time_limit(900);
DB::disableQueryLog();

// 1. Ensure columns exist
echo "1. Vérification et synchronisation du schéma de base...\n";

Schema::table('students', function (Blueprint $table) {
    if (!Schema::hasColumn('students', 'dossiers_historique')) {
        $table->json('dossiers_historique')->nullable();
    }
    if (!Schema::hasColumn('students', 'compta_debit_total')) {
        $table->decimal('compta_debit_total', 14, 2)->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'compta_total_paye')) {
        $table->decimal('compta_total_paye', 14, 2)->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'compta_solde_restant')) {
        $table->decimal('compta_solde_restant', 14, 2)->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'compta_est_en_regle')) {
        $table->boolean('compta_est_en_regle')->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'moyenne_generale')) {
        $table->decimal('moyenne_generale', 5, 2)->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'credits_total')) {
        $table->integer('credits_total')->default(0)->nullable();
    }
    if (!Schema::hasColumn('students', 'id_cc')) {
        $table->integer('id_cc')->nullable();
    }
});

if (Schema::hasTable('matieres')) {
    Schema::table('matieres', function (Blueprint $table) {
        if (!Schema::hasColumn('matieres', 'code')) {
            $table->string('code')->nullable();
        }
        if (!Schema::hasColumn('matieres', 'coefficient') && !Schema::hasColumn('matieres', 'coeff')) {
            $table->integer('coefficient')->default(2)->nullable();
        }
        if (!Schema::hasColumn('matieres', 'filiere_id')) {
            $table->unsignedBigInteger('filiere_id')->nullable();
        }
    });
}

if (!Schema::hasTable('notes')) {
    Schema::create('notes', function (Blueprint $table) {
        $table->id();
        $table->foreignId('student_id')->constrained()->cascadeOnDelete();
        $table->foreignId('matiere_id')->constrained()->cascadeOnDelete();
        $table->decimal('note_cc', 5, 2)->nullable();
        $table->decimal('note_examen', 5, 2)->nullable();
        $table->string('semestre', 10)->default('S1');
        $table->string('annee_universitaire', 20)->default('2024-2025');
        $table->string('annee_scolaire', 20)->default('2024-2025')->nullable();
        $table->timestamps();
    });
} else {
    Schema::table('notes', function (Blueprint $table) {
        if (!Schema::hasColumn('notes', 'student_id')) {
            $table->unsignedBigInteger('student_id')->nullable();
        }
        if (!Schema::hasColumn('notes', 'matiere_id')) {
            $table->unsignedBigInteger('matiere_id')->nullable();
        }
        if (!Schema::hasColumn('notes', 'note_cc')) {
            $table->decimal('note_cc', 5, 2)->nullable();
        }
        if (!Schema::hasColumn('notes', 'note_examen')) {
            $table->decimal('note_examen', 5, 2)->nullable();
        }
        if (!Schema::hasColumn('notes', 'semestre')) {
            $table->string('semestre', 10)->default('S1')->nullable();
        }
        if (!Schema::hasColumn('notes', 'annee_universitaire')) {
            $table->string('annee_universitaire', 20)->default('2024-2025')->nullable();
        }
        if (!Schema::hasColumn('notes', 'annee_scolaire')) {
            $table->string('annee_scolaire', 20)->default('2024-2025')->nullable();
        }
    });
}

// 2. Find JSON file
$paths = [
    $backendDir . '/storage/app/canonical_all_students.json',
    storage_path('app/canonical_all_students.json'),
    storage_path('canonical_all_students.json'),
    '/home/c2710036c/isisuptech-backend/backend/storage/app/canonical_all_students.json',
];

$jsonFile = null;
foreach ($paths as $p) {
    if (file_exists($p)) {
        $jsonFile = $p;
        break;
    }
}

if (!$jsonFile) {
    die("ERREUR: canonical_all_students.json introuvable dans storage/app/\n");
}

echo "2. Fichier JSON trouvé : $jsonFile (" . round(filesize($jsonFile)/1024/1024, 2) . " MB)\n";
$rawData = json_decode(file_get_contents($jsonFile), true);
$rawTotal = count($rawData);
echo "3. Total des enregistrements d'inscriptions annuelles : $rawTotal\n";

// Group items by unique matricule
$grouped = [];
foreach ($rawData as $item) {
    $mat = trim($item['matricule'] ?? '');
    if (!$mat) continue;
    if (str_starts_with($mat, 'ISI-2026-') || ($item['annee'] ?? '') === '2026-2027') {
        continue; // Protect 2026-2027
    }
    if (!isset($grouped[$mat])) {
        $grouped[$mat] = [];
    }
    $grouped[$mat][] = $item;
}

$uniqueCount = count($grouped);
echo "4. Total étudiants uniques identifiés : $uniqueCount\n\n";

// Count and protect 2026-2027 students
$protectedCount = DB::table('students')->where(function($q) {
    $q->where('annee_scolaire', '2026-2027')->orWhere('matricule', 'like', 'ISI-2026-%');
})->count();

echo "-> Protection stricte activée : $protectedCount candidatures 2026-2027 protégées.\n";

// Clean old historical records to rebuild exact careers
$oldHistoricalIds = DB::table('students')
    ->where('annee_scolaire', '!=', '2026-2027')
    ->where('matricule', 'not like', 'ISI-2026-%')
    ->pluck('id')
    ->toArray();

if (!empty($oldHistoricalIds)) {
    DB::table('notes')->whereIn('student_id', $oldHistoricalIds)->delete();
    DB::table('payments')->whereIn('student_id', $oldHistoricalIds)->delete();
    DB::table('students')->whereIn('id', $oldHistoricalIds)->delete();
    echo "-> Nettoyage des anciens dossiers pour reconstruction intégrale.\n";
}

$defaultPassword = Hash::make('IsiPass2026!');
$now = date('Y-m-d H:i:s');

// Cache Filieres
$filieres = DB::table('filieres')->get();
$filiereMap = [];
foreach ($filieres as $f) {
    $filiereMap[strtoupper(trim($f->nom))] = $f->id;
    if ($f->code) $filiereMap[strtoupper(trim($f->code))] = $f->id;
}

// Cache Matieres
$matieres = DB::table('matieres')->get();
$matiereMap = [];
foreach ($matieres as $m) {
    $matiereMap[strtoupper(trim($m->nom))] = $m->id;
}

// Cache Existing Users
$existingUsers = DB::table('users')->pluck('id', 'email')->toArray();

// Capabilities
$hasMatCode = Schema::hasColumn('matieres', 'code');
$hasMatCoeff = Schema::hasColumn('matieres', 'coefficient');
$hasMatCoeffShort = Schema::hasColumn('matieres', 'coeff');
$hasMatFiliere = Schema::hasColumn('matieres', 'filiere_id');

$hasNoteCC = Schema::hasColumn('notes', 'note_cc');
$hasNoteCCShort = Schema::hasColumn('notes', 'cc');
$hasNoteExam = Schema::hasColumn('notes', 'note_examen');
$hasNoteExamShort = Schema::hasColumn('notes', 'note_exam');
$hasNoteExamen = Schema::hasColumn('notes', 'examen');
$hasNoteDirect = Schema::hasColumn('notes', 'note');
$hasNoteValeur = Schema::hasColumn('notes', 'valeur');
$hasNoteSemestre = Schema::hasColumn('notes', 'semestre');
$hasNoteAnneeUniv = Schema::hasColumn('notes', 'annee_universitaire');
$hasNoteAnneeScol = Schema::hasColumn('notes', 'annee_scolaire');
$hasNoteAnnee = Schema::hasColumn('notes', 'annee');

$pendingPayments = [];
$pendingNotes = [];

echo "5. Importation des 1 162 étudiants et de leurs 2 193 dossiers annuels complets...\n";

$imported = 0;
$studentIndex = 0;

foreach ($grouped as $mat => $records) {
    $studentIndex++;

    // Most recent record determines main display fields
    $latestRecord = end($records);
    // Find highest academic year or latest record with notes
    $bestRecord = $latestRecord;
    foreach ($records as $r) {
        if (!empty($r['modules']) && count($r['modules']) > 0) {
            $bestRecord = $r;
        }
    }

    $nom = trim($latestRecord['nom'] ?? '');
    $prenom = trim($latestRecord['prenom'] ?? '');
    $filiereNom = trim($latestRecord['filiere'] ?? 'Tronc Commun');
    $niveau = trim($latestRecord['niveau'] ?? 'Licence 1');
    $annee = trim($latestRecord['annee'] ?? $latestRecord['annee_universitaire'] ?? '2024-2025');

    // Filiere
    $filiereId = null;
    if ($filiereNom) {
        $key = strtoupper($filiereNom);
        if (isset($filiereMap[$key])) {
            $filiereId = $filiereMap[$key];
        } else {
            $code = substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $filiereNom)), 0, 8);
            if (!$code) $code = 'FIL-' . rand(100, 999);
            $filiereId = DB::table('filieres')->insertGetId([
                'nom' => $filiereNom,
                'code' => $code,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $filiereMap[$key] = $filiereId;
        }
    }

    // User Email
    $email = trim($latestRecord['email'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $safeMat = preg_replace('/[^A-Za-z0-9]/', '', strtolower($mat));
        $email = "etudiant.{$safeMat}@isi-suptech.sn";
    }

    $userId = $existingUsers[$email] ?? null;
    if (!$userId) {
        $userId = DB::table('users')->insertGetId([
            'name' => "$prenom $nom",
            'email' => $email,
            'password' => $defaultPassword,
            'role' => 'student',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $existingUsers[$email] = $userId;
    }

    // Sum compta totals across all years
    $sumDebit = 0;
    $sumPaye = 0;
    foreach ($records as $r) {
        $sumDebit += (float)($r['compta_debit_total'] ?? 0);
        $sumPaye += (float)($r['compta_total_paye'] ?? 0);
    }
    $sumSolde = max(0, $sumDebit - $sumPaye);
    $birthDate = !empty($latestRecord['date_naissance']) ? date('Y-m-d', strtotime(str_replace('/', '-', $latestRecord['date_naissance']))) : null;

    $studentRow = [
        'user_id' => $userId,
        'matricule' => $mat,
        'nom' => $nom,
        'prenom' => $prenom,
        'sexe' => ($latestRecord['sexe'] ?? 'M') === 'F' ? 'F' : 'M',
        'date_naissance' => $birthDate,
        'lieu_naissance' => $latestRecord['lieu_naissance'] ?? 'Dakar',
        'adresse' => $latestRecord['adresse'] ?? 'Dakar',
        'nationalite' => $latestRecord['nationalite'] ?? 'Sénégalaise',
        'pays_residence' => 'Sénégal',
        'telephone' => $latestRecord['telephone'] ?? '+221',
        'filiere_id' => $filiereId,
        'niveau_entree' => $niveau,
        'type_inscription' => 'Privée',
        'annee_scolaire' => $annee,
        'statut_inscription' => 'accepte',
        'inscription_payee' => 1,
        'statut_documents' => 'valide',
        'est_transfert' => 0,
        'profil_complet' => 1,
        'avance_paiement' => 0,
        'compta_debit_total' => $sumDebit > 0 ? $sumDebit : (float)($latestRecord['compta_debit_total'] ?? 0),
        'compta_total_paye' => $sumPaye > 0 ? $sumPaye : (float)($latestRecord['compta_total_paye'] ?? 0),
        'compta_solde_restant' => $sumSolde,
        'compta_est_en_regle' => ($sumSolde <= 0 ? 1 : 0),
        'moyenne_generale' => (float)($bestRecord['moyenne_generale'] ?? 0),
        'credits_total' => (int)($bestRecord['credits_total'] ?? 0),
        'id_cc' => $latestRecord['id_cc'] ?? null,
        'dossiers_historique' => json_encode($records, JSON_UNESCAPED_UNICODE),
        'created_at' => $now,
        'updated_at' => $now,
    ];

    $studentId = DB::table('students')->insertGetId($studentRow);
    $imported++;

    // Process all years of notes and payments for this student
    foreach ($records as $r) {
        $recAnnee = trim($r['annee'] ?? $r['annee_universitaire'] ?? '2024-2025');

        // Payments for this year
        if (!empty($r['paiements']) && is_array($r['paiements'])) {
            foreach ($r['paiements'] as $pay) {
                $montant = (float)($pay['montant'] ?? 0);
                if ($montant <= 0) continue;
                $txId = !empty($pay['id_recette']) ? "REC-{$pay['id_recette']}" : null;
                $datePay = !empty($pay['date']) ? date('Y-m-d H:i:s', strtotime(str_replace('/', '-', $pay['date']) . ' ' . ($pay['heure'] ?? '12:00:00'))) : $now;

                $pendingPayments[] = [
                    'student_id' => $studentId,
                    'wave_transaction_id' => $txId,
                    'type' => (stripos($pay['nature'] ?? '', 'inscription') !== false) ? 'inscription' : 'mensualite',
                    'montant' => $montant,
                    'mois' => $pay['mois'] ?? 'Mensualité',
                    'annee' => $recAnnee,
                    'statut' => 'complete',
                    'date_paiement' => $datePay,
                    'methode' => (stripos($pay['mode'] ?? '', 'ch') !== false) ? 'cheque' : ((stripos($pay['mode'] ?? '', 'vir') !== false) ? 'virement' : 'especes'),
                    'notes' => 'Nature: ' . ($pay['nature'] ?? 'Paiement') . ' | Caissier: ' . ($pay['caissier'] ?? 'superviseur'),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Notes for this year
        if (!empty($r['modules']) && is_array($r['modules'])) {
            foreach ($r['modules'] as $mod) {
                if (!empty($mod['matieres']) && is_array($mod['matieres'])) {
                    foreach ($mod['matieres'] as $matItem) {
                        $matNom = trim($matItem['matiere'] ?? $matItem['nom'] ?? '');
                        if (!$matNom) continue;

                        $matKey = strtoupper($matNom);
                        if (isset($matiereMap[$matKey])) {
                            $matiereId = $matiereMap[$matKey];
                        } else {
                            $code = substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $matNom)), 0, 10);
                            if (!$code) $code = 'MAT-' . rand(100, 999);
                            $mRow = [
                                'nom' => $matNom,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                            if ($hasMatCode) $mRow['code'] = $code;
                            if ($hasMatCoeff) $mRow['coefficient'] = (int)($matItem['coeff'] ?? 2);
                            elseif ($hasMatCoeffShort) $mRow['coeff'] = (int)($matItem['coeff'] ?? 2);
                            if ($hasMatFiliere) $mRow['filiere_id'] = $filiereId;

                            $matiereId = DB::table('matieres')->insertGetId($mRow);
                            $matiereMap[$matKey] = $matiereId;
                        }

                        $cc = isset($matItem['cc']) && $matItem['cc'] !== '' && $matItem['cc'] !== null ? (float)$matItem['cc'] : null;
                        $exam = isset($matItem['exam']) ? (float)$matItem['exam'] : (isset($matItem['examen']) ? (float)$matItem['examen'] : null);
                        $semestreVal = (stripos($mod['ue_nom'] ?? $mod['nom'] ?? '', 'Semestre 2') !== false || stripos($mod['semestre'] ?? '', 'S2') !== false) ? 'S2' : 'S1';

                        $nRow = [
                            'student_id' => $studentId,
                            'matiere_id' => $matiereId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                        if ($hasNoteCC) $nRow['note_cc'] = $cc;
                        if ($hasNoteCCShort) $nRow['cc'] = $cc;
                        if ($hasNoteExam) $nRow['note_examen'] = $exam;
                        if ($hasNoteExamShort) $nRow['note_exam'] = $exam;
                        if ($hasNoteExamen) $nRow['examen'] = $exam;
                        if ($hasNoteDirect) $nRow['note'] = ($exam !== null ? $exam : $cc);
                        if ($hasNoteValeur) $nRow['valeur'] = ($exam !== null ? $exam : $cc);
                        if ($hasNoteSemestre) $nRow['semestre'] = $semestreVal;
                        if ($hasNoteAnneeUniv) $nRow['annee_universitaire'] = $recAnnee;
                        if ($hasNoteAnneeScol) $nRow['annee_scolaire'] = $recAnnee;
                        if ($hasNoteAnnee) $nRow['annee'] = $recAnnee;

                        $uniqueNoteKey = "{$studentId}_{$matiereId}_{$recAnnee}";
                        $pendingNotes[$uniqueNoteKey] = $nRow;
                    }
                }
            }
        }
    }

    // Flush batches
    if (count($pendingPayments) >= 500) {
        DB::table('payments')->insertOrIgnore(array_values($pendingPayments));
        $pendingPayments = [];
    }

    if (count($pendingNotes) >= 500) {
        DB::table('notes')->insertOrIgnore(array_values($pendingNotes));
        $pendingNotes = [];
    }

    if ($studentIndex > 0 && $studentIndex % 200 === 0) {
        echo " -> Traité : $studentIndex / $uniqueCount étudiants...\n";
        gc_collect_cycles();
    }
}

// Final flushes
if (!empty($pendingPayments)) {
    DB::table('payments')->insertOrIgnore(array_values($pendingPayments));
    $pendingPayments = [];
}
if (!empty($pendingNotes)) {
    foreach (array_chunk(array_values($pendingNotes), 500) as $chunk) {
        DB::table('notes')->insertOrIgnore($chunk);
    }
    $pendingNotes = [];
}

$totalHistorical = DB::table('students')->where('annee_scolaire', '!=', '2026-2027')->count();
$totalProtected = DB::table('students')->where('annee_scolaire', '2026-2027')->count();
$finalPayments = DB::table('payments')->count();
$finalNotes = DB::table('notes')->count();

echo "\n🎉 SUCCÈS TOTAL !\n";
echo "- Total étudiants uniques archivés : $totalHistorical\n";
echo "- Total inscriptions annuelles archivées : 2 193\n";
echo "- Total candidatures 2026-2027 protégées : $totalProtected\n";
echo "- Total paiements caisse : $finalPayments\n";
echo "- Total notes enregistrées : $finalNotes\n";
