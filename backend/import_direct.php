<?php

// Standalone direct import script that groups all 2 193 annual career records
// into 1 162 unique student profiles with complete multi-year history, notes, and payments,
// while strictly protecting all 2026-2027 admissions and candidatures.
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
echo "=== IMPORTATION ET SYNCHRONISATION PARFAITE DES 2 193 DOSSIERS ANNUELS ===\n\n";

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
$data = json_decode(file_get_contents($jsonFile), true);
$total = count($data);
echo "3. Total des enregistrements d'inscriptions annuelles : $total\n\n";

// S'assurer que tous les étudiants en cours d'admission 2026-2027 ont annee_scolaire = '2026-2027'
DB::table('students')
    ->whereIn('statut_inscription', ['en_attente', 'en_attente_paiement'])
    ->orWhere('matricule', 'like', 'ISI-2026-%')
    ->update(['annee_scolaire' => '2026-2027']);

// Count 2026-2027 students to protect
$protectedCount = DB::table('students')->where(function($q) {
    $q->where('annee_scolaire', '2026-2027')
      ->orWhere('matricule', 'like', 'ISI-2026-%')
      ->orWhereIn('statut_inscription', ['en_attente', 'en_attente_paiement']);
})->count();

echo "-> Protection stricte activée : $protectedCount candidatures 2026-2027 protégées.\n";

// Remove old historical students & notes to do a clean 100% rebuild
$oldHistoricalIds = DB::table('students')
    ->where('annee_scolaire', '!=', '2026-2027')
    ->where('matricule', 'not like', 'ISI-2026-%')
    ->whereNotIn('statut_inscription', ['en_attente', 'en_attente_paiement'])
    ->pluck('id')
    ->toArray();

if (!empty($oldHistoricalIds)) {
    DB::table('notes')->whereIn('student_id', $oldHistoricalIds)->delete();
    DB::table('payments')->whereIn('student_id', $oldHistoricalIds)->delete();
    DB::table('students')->whereIn('id', $oldHistoricalIds)->delete();
    echo "-> Nettoyage des anciens dossiers partiels pour réinsertion complète des 2 193 dossiers annuels.\n";
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

// Column capabilities check
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

// 4. GROUP ALL 2,193 RECORDS BY UNIQUE MATRICULE (yields ~1,162 unique students)
echo "4. Regroupement des 2 193 dossiers par matricule unique...\n";

$groupedStudents = [];
foreach ($data as $item) {
    $matricule = trim($item['matricule'] ?? '');
    if (!$matricule) continue;

    $annee = trim($item['annee'] ?? $item['annee_universitaire'] ?? '2024-2025');

    // Skip 2026-2027 from canonical data if any
    if (str_starts_with($matricule, 'ISI-2026-') || $annee === '2026-2027') {
        continue;
    }

    if (!isset($groupedStudents[$matricule])) {
        $groupedStudents[$matricule] = [
            'matricule' => $matricule,
            'records'   => [],
        ];
    }
    $groupedStudents[$matricule]['records'][] = $item;
}

$uniqueCount = count($groupedStudents);
echo "-> $uniqueCount étudiants uniques trouvés à partir des 2 193 inscriptions annuelles.\n\n";
echo "5. Insertion des étudiants avec historique multi-années complet, notes et caisse...\n";

$pendingPayments = [];
$pendingNotes = [];
$importedStudents = 0;
$totalRecordsProcessed = 0;

foreach ($groupedStudents as $matricule => $group) {
    $records = $group['records'];
    // Sort records by academic year ascending (e.g. 2017-2018, 2018-2019, ...)
    usort($records, function ($a, $b) {
        $ay = $a['annee'] ?? $a['annee_universitaire'] ?? '';
        $by = $b['annee'] ?? $b['annee_universitaire'] ?? '';
        return strcmp($ay, $by);
    });

    // Use latest record for primary profile info
    $latest = end($records);

    $nom = trim($latest['nom'] ?? '');
    $prenom = trim($latest['prenom'] ?? '');
    $filiereNom = trim($latest['filiere'] ?? 'Tronc Commun');
    $niveau = trim($latest['niveau'] ?? 'Licence 1');
    $latestAnnee = trim($latest['annee'] ?? $latest['annee_universitaire'] ?? '2024-2025');
    $idCc = !empty($latest['id_cc']) ? intval($latest['id_cc']) : (!empty($latest['id']) ? intval($latest['id']) : null);

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
    $email = trim($latest['email'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $safeMat = preg_replace('/[^A-Za-z0-9]/', '', strtolower($matricule));
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

    // Aggregate totals across all career years
    $cumulDebit = 0;
    $cumulPaye = 0;
    $cumulSolde = 0;
    $historySummary = [];

    foreach ($records as $r) {
        $rAnnee = trim($r['annee'] ?? $r['annee_universitaire'] ?? '2024-2025');
        $rDebit = (float)($r['compta_debit_total'] ?? 0);
        $rPaye = (float)($r['compta_total_paye'] ?? 0);
        $rSolde = (float)($r['compta_solde_restant'] ?? 0);
        $cumulDebit += $rDebit;
        $cumulPaye += $rPaye;
        $cumulSolde += $rSolde;

        $historySummary[] = [
            'annee' => $rAnnee,
            'annee_universitaire' => $rAnnee,
            'filiere' => $r['filiere'] ?? $filiereNom,
            'niveau' => $r['niveau'] ?? $niveau,
            'moyenne_generale' => (float)($r['moyenne_generale'] ?? 0),
            'credits_total' => (int)($r['credits_total'] ?? 0),
            'compta_debit_total' => $rDebit,
            'compta_total_paye' => $rPaye,
            'compta_solde_restant' => $rSolde,
            'modules_count' => count($r['modules'] ?? []),
            'paiements_count' => count($r['paiements'] ?? []),
        ];
    }

    $birthDate = !empty($latest['date_naissance']) ? date('Y-m-d', strtotime(str_replace('/', '-', $latest['date_naissance']))) : null;

    $studentRow = [
        'user_id' => $userId,
        'matricule' => $matricule,
        'nom' => $nom,
        'prenom' => $prenom,
        'sexe' => ($latest['sexe'] ?? 'M') === 'F' ? 'F' : 'M',
        'date_naissance' => $birthDate,
        'lieu_naissance' => $latest['lieu_naissance'] ?? 'Dakar',
        'adresse' => $latest['adresse'] ?? 'Dakar',
        'nationalite' => $latest['nationalite'] ?? 'Sénégalaise',
        'pays_residence' => 'Sénégal',
        'telephone' => $latest['telephone'] ?? '+221',
        'filiere_id' => $filiereId,
        'niveau_entree' => $niveau,
        'type_inscription' => 'Privée',
        'annee_scolaire' => $latestAnnee,
        'statut_inscription' => 'accepte',
        'inscription_payee' => 1,
        'statut_documents' => 'valide',
        'est_transfert' => 0,
        'profil_complet' => 1,
        'avance_paiement' => 0,
        'compta_debit_total' => $cumulDebit,
        'compta_total_paye' => $cumulPaye,
        'compta_solde_restant' => $cumulSolde,
        'compta_est_en_regle' => ($cumulSolde <= 0 ? 1 : 0),
        'moyenne_generale' => (float)($latest['moyenne_generale'] ?? 0),
        'credits_total' => (int)($latest['credits_total'] ?? 0),
        'id_cc' => $idCc,
        'dossiers_historique' => json_encode($historySummary, JSON_UNESCAPED_UNICODE),
        'created_at' => $now,
        'updated_at' => $now,
    ];

    $studentId = DB::table('students')->insertGetId($studentRow);
    $importedStudents++;

    // Process all years for this student
    foreach ($records as $r) {
        $rAnnee = trim($r['annee'] ?? $r['annee_universitaire'] ?? '2024-2025');
        $totalRecordsProcessed++;

        // Payments
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
                    'annee' => $rAnnee,
                    'statut' => 'complete',
                    'date_paiement' => $datePay,
                    'methode' => (stripos($pay['mode'] ?? '', 'ch') !== false) ? 'cheque' : ((stripos($pay['mode'] ?? '', 'vir') !== false) ? 'virement' : 'especes'),
                    'notes' => 'Nature: ' . ($pay['nature'] ?? 'Paiement') . ' | Caissier: ' . ($pay['caissier'] ?? 'superviseur'),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Notes & Modules
        if (!empty($r['modules']) && is_array($r['modules'])) {
            foreach ($r['modules'] as $mod) {
                if (!empty($mod['matieres']) && is_array($mod['matieres'])) {
                    foreach ($mod['matieres'] as $mat) {
                        $matNom = trim($mat['matiere'] ?? $mat['nom'] ?? '');
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
                            if ($hasMatCoeff) $mRow['coefficient'] = (int)($mat['coeff'] ?? 2);
                            elseif ($hasMatCoeffShort) $mRow['coeff'] = (int)($mat['coeff'] ?? 2);
                            if ($hasMatFiliere) $mRow['filiere_id'] = $filiereId;

                            $matiereId = DB::table('matieres')->insertGetId($mRow);
                            $matiereMap[$matKey] = $matiereId;
                        }

                        $cc = isset($mat['cc']) && $mat['cc'] !== '' && $mat['cc'] !== null ? (float)$mat['cc'] : null;
                        $exam = isset($mat['exam']) ? (float)$mat['exam'] : (isset($mat['examen']) ? (float)$mat['examen'] : null);
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
                        if ($hasNoteAnneeUniv) $nRow['annee_universitaire'] = $rAnnee;
                        if ($hasNoteAnneeScol) $nRow['annee_scolaire'] = $rAnnee;
                        if ($hasNoteAnnee) $nRow['annee'] = $rAnnee;

                        $uniqueNoteKey = "{$studentId}_{$matiereId}_{$rAnnee}";
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

    if ($importedStudents % 200 === 0) {
        echo " -> Traité : $importedStudents / $uniqueCount étudiants uniques ($totalRecordsProcessed dossiers annuels)...\n";
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
echo "- Total étudiants uniques archivés (Anciens) : $totalHistorical\n";
echo "- Total dossiers annuels intégrés : $totalRecordsProcessed\n";
echo "- Total candidatures 2026-2027 préservées : $totalProtected\n";
echo "- Total paiements caisse : $finalPayments\n";
echo "- Total notes enregistrées : $finalNotes\n";
