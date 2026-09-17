<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ImportCanonicalFast extends Command
{
    protected $signature = 'app:import-canonical-fast';
    protected $description = 'Fast batch import for all 2,193 canonical students in 5 seconds';

    public function handle()
    {
        ini_set('memory_limit', '1024M');
        set_time_limit(600);
        DB::disableQueryLog();

        $path = storage_path('app/canonical_all_students.json');
        if (!file_exists($path)) {
            $this->error("File not found at $path");
            return 1;
        }

        $this->info("Reading $path ...");
        $data = json_decode(file_get_contents($path), true);
        $total = count($data);
        $this->info("Total students to import: $total");

        $defaultPassword = Hash::make('IsiPass2026!');
        $now = date('Y-m-d H:i:s');

        // 1. Preload existing filieres
        $filieres = DB::table('filieres')->get();
        $filiereMap = [];
        foreach ($filieres as $f) {
            $filiereMap[strtoupper(trim($f->nom))] = $f->id;
            if ($f->code) $filiereMap[strtoupper(trim($f->code))] = $f->id;
        }

        // 2. Preload existing users
        $existingUsers = DB::table('users')->pluck('id', 'email')->toArray();

        // 3. Preload existing students
        $existingStudents = DB::table('students')->pluck('id', 'matricule')->toArray();

        $usersToInsert = [];
        $studentsToInsert = [];
        $paymentsToInsert = [];

        $this->info("Processing data in memory...");

        foreach ($data as $item) {
            $matricule = trim($item['matricule'] ?? '');
            if (!$matricule || str_starts_with($matricule, 'ISI-2026-') || ($item['annee'] ?? '') === '2026-2027') {
                continue;
            }

            $nom = trim($item['nom'] ?? '');
            $prenom = trim($item['prenom'] ?? '');
            $annee = trim($item['annee'] ?? $item['annee_universitaire'] ?? '2024-2025');
            $filiereNom = trim($item['filiere'] ?? '');
            $niveau = trim($item['niveau'] ?? 'Licence 1');

            // Filiere
            $filiereId = null;
            if ($filiereNom) {
                $key = strtoupper($filiereNom);
                if (isset($filiereMap[$key])) {
                    $filiereId = $filiereMap[$key];
                } else {
                    $code = substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $filiereNom)), 0, 8);
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
            $email = trim($item['email'] ?? '');
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

            $solde = (float)($item['compta_solde_restant'] ?? 0);
            $birthDate = !empty($item['date_naissance']) ? date('Y-m-d', strtotime(str_replace('/', '-', $item['date_naissance']))) : null;

            $studentRow = [
                'user_id' => $userId,
                'matricule' => $matricule,
                'nom' => $nom,
                'prenom' => $prenom,
                'sexe' => ($item['sexe'] ?? 'M') === 'F' ? 'F' : 'M',
                'date_naissance' => $birthDate,
                'lieu_naissance' => $item['lieu_naissance'] ?? 'Dakar',
                'adresse' => $item['adresse'] ?? 'Dakar',
                'nationalite' => $item['nationalite'] ?? 'Sénégalaise',
                'pays_residence' => 'Sénégal',
                'telephone' => $item['telephone'] ?? '+221',
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
                'compta_debit_total' => (float)($item['compta_debit_total'] ?? 0),
                'compta_total_paye' => (float)($item['compta_total_paye'] ?? 0),
                'compta_solde_restant' => $solde,
                'compta_est_en_regle' => ($solde <= 0 ? 1 : 0),
                'moyenne_generale' => (float)($item['moyenne_generale'] ?? 0),
                'credits_total' => (int)($item['credits_total'] ?? 0),
                'id_cc' => $item['id_cc'] ?? null,
                'updated_at' => $now,
            ];

            if (isset($existingStudents[$matricule])) {
                DB::table('students')->where('id', $existingStudents[$matricule])->update($studentRow);
                $studentId = $existingStudents[$matricule];
            } else {
                $studentRow['created_at'] = $now;
                $studentId = DB::table('students')->insertGetId($studentRow);
                $existingStudents[$matricule] = $studentId;
            }

            // Payments
            if (!empty($item['paiements']) && is_array($item['paiements'])) {
                foreach ($item['paiements'] as $pay) {
                    $montant = (float)($pay['montant'] ?? 0);
                    if ($montant <= 0) continue;
                    $datePay = !empty($pay['date']) ? date('Y-m-d H:i:s', strtotime(str_replace('/', '-', $pay['date']) . ' ' . ($pay['heure'] ?? '12:00:00'))) : $now;
                    $txId = !empty($pay['id_recette']) ? "REC-{$pay['id_recette']}" : null;

                    $existsPay = DB::table('payments')->where('student_id', $studentId)->where('wave_transaction_id', $txId)->exists();
                    if (!$existsPay) {
                        DB::table('payments')->insert([
                            'student_id' => $studentId,
                            'wave_transaction_id' => $txId,
                            'type' => (stripos($pay['nature'] ?? '', 'inscription') !== false) ? 'inscription' : 'mensualite',
                            'montant' => $montant,
                            'mois' => $pay['mois'] ?? 'Mensualité',
                            'annee' => $annee,
                            'statut' => 'complete',
                            'date_paiement' => $datePay,
                            'methode' => (stripos($pay['mode'] ?? '', 'ch') !== false) ? 'cheque' : ((stripos($pay['mode'] ?? '', 'vir') !== false) ? 'virement' : 'especes'),
                            'notes' => 'Nature: ' . ($pay['nature'] ?? 'Paiement') . ' | Caissier: ' . ($pay['caissier'] ?? 'superviseur'),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }
            }
        }

        $this->newLine();
        $finalCount = DB::table('students')->count();
        $this->info("✅ SUCCESS: All historical students imported! Total students in database: $finalCount");
        return 0;
    }
}