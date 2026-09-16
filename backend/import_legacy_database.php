<?php
/**
 * Script d'importation ultra-optimisé et non destructif des 2 193 dossiers historiques
 * dans la base de données Laravel ISI-SUPTECH.
 */

ini_set('memory_limit', '1024M');
set_time_limit(0);

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Filiere;
use App\Models\License;
use App\Models\Student;
use App\Models\Semestre;
use App\Models\Module;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\Payment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$jsonPath = 'C:/Users/azoto/OneDrive/Desktop/retroingenieurie/students_real_data.json';
if (!file_exists($jsonPath)) {
    die("[ERREUR] Fichier introuvable : {$jsonPath}\n");
}

$studentsData = json_decode(file_get_contents($jsonPath), true);
$total = count($studentsData);
echo "=== DÉBUT DE L'IMPORTATION RAPIDE DES {$total} DOSSIERS ÉTUDIANTS ===\n\n";

// Caches en mémoire pour zéro requête redondante
$filieresCache = Filiere::all()->keyBy(fn($f) => mb_strtolower(trim($f->nom)))->all();
$licensesCache = License::all()->keyBy(fn($l) => $l->filiere_id . '_' . mb_strtolower(trim($l->nom)))->all();
$semestresCache = Semestre::all()->keyBy(fn($s) => $s->license_id . '_' . $s->numero_global)->all();
$modulesCache = Module::all()->keyBy(fn($m) => $m->semestre_id . '_' . mb_strtolower(trim($m->nom)))->all();
$matieresCache = Matiere::all()->keyBy(fn($m) => $m->module_id . '_' . mb_strtolower(trim($m->nom)))->all();
$usersCache = User::pluck('id', 'email')->all();

$protectedMatricules = Student::where('annee_scolaire', 'like', '2026%')
    ->pluck('matricule')->filter()->toArray();

echo "Étudiants 2026-2027 protégés : " . count($protectedMatricules) . "\n";

$createdStudents = 0;
$skippedStudents = 0;
$totalPaymentsInserted = 0;
$totalNotesInserted = 0;

$now = date('Y-m-d H:i:s');
$hashedPassword = Hash::make('suptech2026');

// Traitement par batch de 150 dossiers
$chunkSize = 150;
$chunks = array_chunk($studentsData, $chunkSize);

foreach ($chunks as $chunkIdx => $chunk) {
    DB::beginTransaction();
    try {
        foreach ($chunk as $s) {
            $matricule = trim($s['matricule'] ?? '');
            $nom = trim($s['nom'] ?? '');
            $prenom = trim($s['prenom'] ?? '');
            $annee = trim($s['annee'] ?? '2024-2025');

            if (empty($matricule) || empty($nom)) continue;
            if (in_array($matricule, $protectedMatricules)) {
                $skippedStudents++;
                continue;
            }

            // 1. Filière
            $filiereNom = trim($s['filiere'] ?? 'Informatique');
            $fKey = mb_strtolower($filiereNom);
            if (!isset($filieresCache[$fKey])) {
                $codeBase = 'FIL-' . strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $filiereNom), 0, 4));
                $code = $codeBase;
                $c = 1;
                while (Filiere::where('code', $code)->exists()) {
                    $code = $codeBase . '-' . $c;
                    $c++;
                }
                $filiere = Filiere::create(['nom' => $filiereNom, 'code' => $code, 'description' => $filiereNom]);
                $filieresCache[$fKey] = $filiere;
            } else {
                $filiere = $filieresCache[$fKey];
            }

            // 2. Niveau (License)
            $niveauNom = trim($s['niveau'] ?? 'Licence 1');
            $cleanNiveauNom = trim(preg_replace('/\s*\(\d{4}[^\)]*\)/', '', $niveauNom));
            $lKey = $filiere->id . '_' . mb_strtolower($cleanNiveauNom);

            if (!isset($licensesCache[$lKey])) {
                $license = License::where('filiere_id', $filiere->id)->where('nom', $cleanNiveauNom)->first();
                if (!$license) {
                    $codeBase = 'LIC-' . $filiere->id . '-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $cleanNiveauNom), 0, 6));
                    $codeLic = $codeBase;
                    $c = 1;
                    while (License::where('code', $codeLic)->exists()) {
                        $codeLic = $codeBase . '-' . $c;
                        $c++;
                    }
                    $license = License::create([
                        'filiere_id'          => $filiere->id,
                        'nom'                 => $cleanNiveauNom,
                        'code'                => $codeLic,
                        'duree_annees'        => 3,
                        'mois_debut'          => 10,
                        'mois_fin'            => 7,
                        'frais_inscription'   => 220000,
                        'frais_reinscription' => 200000,
                        'frais_mensuel'       => 70000,
                        'actif'               => true,
                        'calcul_simple'       => false,
                    ]);
                }
                $licensesCache[$lKey] = $license;
            } else {
                $license = $licensesCache[$lKey];
            }

            // 3. User
            $email = trim($s['email'] ?? '');
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $safePre = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $prenom));
                $safeNom = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nom));
                $email = "{$safePre}.{$safeNom}.{$s['id']}@suptech.sn";
            }

            if (!isset($usersCache[$email])) {
                $user = User::create([
                    'name'     => "{$prenom} {$nom}",
                    'email'    => $email,
                    'password' => $hashedPassword,
                    'role'     => 'student',
                ]);
                $userId = $user->id;
                $usersCache[$email] = $userId;
            } else {
                $userId = $usersCache[$email];
            }

            // 4. Student
            $student = Student::updateOrCreate(
                ['matricule' => $matricule],
                [
                    'user_id'             => $userId,
                    'nom'                 => $nom,
                    'prenom'              => $prenom,
                    'telephone'           => $s['telephone'] ?: '770000000',
                    'sexe'                => in_array($s['sexe'], ['M', 'F']) ? $s['sexe'] : 'M',
                    'date_naissance'      => (!empty($s['date_naissance']) && strtotime($s['date_naissance'])) ? date('Y-m-d', strtotime($s['date_naissance'])) : '2000-01-01',
                    'lieu_naissance'      => $s['lieu_naissance'] ?: 'Dakar',
                    'adresse'             => $s['adresse'] ?: 'Dakar, Sénégal',
                    'nationalite'         => $s['nationalite'] ?: 'Sénégalaise',
                    'pays_residence'      => 'Sénégal',
                    'filiere_id'          => $filiere->id,
                    'license_id'          => $license->id,
                    'annee_scolaire'      => $annee,
                    'statut_inscription'  => 'accepte',
                    'inscription_payee'   => true,
                    'tuteur_telephone'    => $s['telephone_tuteur'] ?: null,
                    'notes_admin'         => "Dossier Reconstitué LEA-GEST / SUPTECH. Statut : " . ($s['statut_validation'] ?? 'EN COURS'),
                ]
            );
            $createdStudents++;

            // 5. Semestres, Modules et Notes
            if (!empty($s['modules'])) {
                foreach ($s['modules'] as $mod) {
                    $semLabel = $mod['semestre'] ?? 'Semestre 1';
                    preg_match('/(\d+)/', $semLabel, $sm);
                    $numSem = isset($sm[1]) ? intval($sm[1]) : 1;
                    $numAnnee = intval(ceil($numSem / 2));
                    $numSemDansAnnee = ($numSem % 2 === 0) ? 2 : 1;

                    $semKey = $license->id . '_' . $numSem;
                    if (!isset($semestresCache[$semKey])) {
                        $semestre = Semestre::firstOrCreate(
                            ['license_id' => $license->id, 'numero_global' => $numSem],
                            [
                                'annee'          => $numAnnee,
                                'numero'         => $numSemDansAnnee,
                                'libelle'        => "Semestre {$numSem}",
                                'credits_requis' => 30,
                            ]
                        );
                        $semestresCache[$semKey] = $semestre;
                    } else {
                        $semestre = $semestresCache[$semKey];
                    }

                    $ueNom = trim($mod['ue_nom'] ?? 'Unité d\'Enseignement');
                    $modKey = $semestre->id . '_' . mb_strtolower($ueNom);

                    if (!isset($modulesCache[$modKey])) {
                        $ueCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $ueNom), 0, 6));
                        $ueCredits = floatval($mod['ue_credits'] ?? 6);
                        $module = Module::firstOrCreate(
                            ['semestre_id' => $semestre->id, 'nom' => $ueNom],
                            ['code' => $ueCode, 'credits' => $ueCredits, 'ordre' => 1]
                        );
                        $modulesCache[$modKey] = $module;
                    } else {
                        $module = $modulesCache[$modKey];
                    }

                    if (!empty($mod['matieres'])) {
                        foreach ($mod['matieres'] as $mat) {
                            $matNom = trim($mat['matiere'] ?? 'Élément Constitutif');
                            $matKey = $module->id . '_' . mb_strtolower($matNom);

                            if (!isset($matieresCache[$matKey])) {
                                $matCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $matNom), 0, 6));
                                $matCoef = floatval($mat['coeff'] ?? 1);
                                $matCredits = floatval($mat['credits'] ?? 3);

                                $matiere = Matiere::firstOrCreate(
                                    ['module_id' => $module->id, 'nom' => $matNom],
                                    ['code' => $matCode, 'coef' => $matCoef, 'credits' => $matCredits, 'ordre' => 1]
                                );
                                $matieresCache[$matKey] = $matiere;
                            } else {
                                $matiere = $matieresCache[$matKey];
                            }

                            $cc = floatval($mat['cc'] ?? 0);
                            $exam = floatval($mat['exam'] ?? 0);
                            $ratt = floatval($mat['rattrapage'] ?? 0);
                            $noteEff = $ratt > 0 ? max($ratt, $exam) : $exam;

                            Note::updateOrCreate(
                                [
                                    'student_id'     => $student->id,
                                    'matiere_id'     => $matiere->id,
                                    'annee_scolaire' => $annee,
                                ],
                                [
                                    'mcc'            => $cc > 0 ? $cc : null,
                                    'examen'         => $noteEff > 0 ? $noteEff : null,
                                ]
                            );
                            $totalNotesInserted++;
                        }
                    }
                }
            }

            // 6. Règlements de caisse
            if (!empty($s['paiements'])) {
                foreach ($s['paiements'] as $p) {
                    $numRecette = $p['id_recette'] ?? null;
                    $montant = floatval($p['montant'] ?? 0);
                    if ($montant <= 0) continue;

                    $datePaiement = (!empty($p['date']) && strtotime($p['date'])) ? date('Y-m-d H:i:s', strtotime($p['date'])) : $now;
                    $nature = $p['nature'] ?? 'Mensualité';
                    $mois = $p['mois'] ?? null;
                    $caissier = $p['caissier'] ?? 'Caisse Centrale';
                    $mode = $p['mode'] ?? 'ESPECES';

                    Payment::firstOrCreate(
                        [
                            'student_id'       => $student->id,
                            'wave_checkout_id' => "LEGACY-REC-{$numRecette}-{$student->id}",
                        ],
                        [
                            'type'          => (stripos($nature, 'inscription') !== false || stripos($nature, 'scolarité') !== false) ? 'inscription' : 'mensualite',
                            'montant'       => $montant,
                            'mois'          => $mois,
                            'annee'         => $annee,
                            'statut'        => 'complete',
                            'date_paiement' => $datePaiement,
                            'methode'       => $mode,
                            'notes'         => "Reçu N° {$numRecette} - {$nature} (Agent: {$caissier})",
                        ]
                    );
                    $totalPaymentsInserted++;
                }
            }
        }
        DB::commit();
        $processed = min($total, ($chunkIdx + 1) * $chunkSize);
        echo "Progression : {$processed} / {$total} dossiers enregistrés en base...\n";
    } catch (\Exception $e) {
        DB::rollBack();
        echo "[ERREUR DANS LE BATCH {$chunkIdx}] " . $e->getMessage() . "\n";
    }
}

echo "\n=== IMPORTATION COMPLÈTE TERMINÉE AVEC SUCCÈS ! ===\n";
echo "Étudiants historiques enregistrés : {$createdStudents}\n";
echo "Notes enregistrées : {$totalNotesInserted}\n";
echo "Reçus de caisse enregistrés : {$totalPaymentsInserted}\n";
echo "Dossiers 2026-2027 préservés : {$skippedStudents}\n";
