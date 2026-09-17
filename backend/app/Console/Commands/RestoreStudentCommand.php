<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\Student;
use App\Models\User;
use App\Models\Filiere;
use App\Models\License;
use App\Models\Payment;

class RestoreStudentCommand extends Command
{
    protected $signature = 'app:restore-student {search=Niasse}';
    protected $description = 'Restores specific student(s) from canonical_all_students.json into database';

    public function handle()
    {
        $search = $this->argument('search');
        $this->info("Restoring students matching '{$search}' from canonical JSON...");

        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'dossiers_historique')) {
                $table->longText('dossiers_historique')->nullable();
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
        });

        $jsonPath = file_exists(storage_path('app/canonical_all_students.json'))
            ? storage_path('app/canonical_all_students.json')
            : (file_exists(base_path('canonical_all_students.json')) ? base_path('canonical_all_students.json') : base_path('../retroingenieurie/canonical_all_students.json'));

        if (!file_exists($jsonPath)) {
            $this->error("canonical_all_students.json not found at {$jsonPath}");
            return 1;
        }

        $allData = json_decode(file_get_contents($jsonPath), true);
        if (!$allData) {
            $this->error("Invalid JSON data");
            return 1;
        }

        $matched = array_filter($allData, function ($s) use ($search) {
            $str = ($s['matricule'] ?? '') . ' ' . ($s['nom'] ?? '') . ' ' . ($s['prenom'] ?? '');
            return stripos($str, $search) !== false;
        });

        if (empty($matched)) {
            $this->warn("No student found matching '{$search}' in canonical JSON");
            return 0;
        }

        $this->info("Found " . count($matched) . " matching student(s). Importing...");

        foreach ($matched as $st) {
            $matricule = $st['matricule'];
            $email = ($st['email'] ?? null) ?: (strtolower(preg_replace('/[^a-zA-Z0-9]/', '', ($st['prenom'] ?? '') . '.' . ($st['nom'] ?? ''))) . '@isisuptech.edu.sn');

            // Find or create User
            $user = User::where('email', $email)->first();
            if (!$user) {
                $user = User::create([
                    'name'      => trim(($st['prenom'] ?? '') . ' ' . ($st['nom'] ?? '')),
                    'email'     => $email,
                    'role'      => 'student',
                    'password'  => \Illuminate\Support\Facades\Hash::make('Passer123'),
                ]);
            }

            // Find or create Filiere & License
            $filiereName = $st['filiere'] ?? 'Informatique';
            $classeName = $st['classe_complete'] ?? ($st['classe'] ?? $filiereName);

            $fil = Filiere::firstOrCreate(['nom' => $filiereName], ['code' => strtoupper(substr($filiereName, 0, 4))]);
            $lic = License::firstOrCreate(['filiere_id' => $fil->id, 'nom' => $classeName], [
                'code' => strtoupper(substr($classeName, 0, 6)),
                'frais_inscription' => 150000,
                'frais_mensuel' => 70000,
            ]);

            $sexe = strtoupper(substr($st['sexe'] ?? 'M', 0, 1)) === 'F' ? 'F' : 'M';

            // Create or update Student
            $student = Student::updateOrCreate(
                ['matricule' => $matricule],
                [
                    'user_id'              => $user->id,
                    'filiere_id'           => $fil->id,
                    'license_id'           => $lic->id,
                    'nom'                  => $st['nom'],
                    'prenom'               => $st['prenom'],
                    'email'                => $email,
                    'telephone'            => $st['telephone'] ?? '770000000',
                    'sexe'                 => $sexe,
                    'statut_inscription'   => 'accepte',
                    'inscription_payee'    => true,
                    'annee_scolaire'       => $st['annee_scolaire'] ?? '2024-2025',
                    'compta_debit_total'   => $st['total_du'] ?? 0,
                    'compta_total_paye'    => $st['total_verse'] ?? 0,
                    'compta_solde_restant' => $st['solde_restant'] ?? 0,
                    'compta_est_en_regle'  => ($st['solde_restant'] ?? 0) <= 0,
                    'moyenne_generale'     => $st['moyenne_generale'] ?? 0,
                    'dossiers_historique'  => !empty($st['dossiers_historique']) ? json_encode($st['dossiers_historique']) : null,
                ]
            );

            // Import payments
            if (!empty($st['paiements'])) {
                foreach ($st['paiements'] as $p) {
                    Payment::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'montant'    => $p['montant'],
                            'mois'       => $p['mois'] ?? null,
                            'type'       => strtolower($p['nature'] ?? 'mensualite') === 'inscription' ? 'inscription' : 'mensualite',
                        ],
                        [
                            'libelle'       => ($p['nature'] ?? 'Paiement') . ' ' . ($p['mois'] ?? ''),
                            'annee'         => $student->annee_scolaire ?: '2024-2025',
                            'statut'        => 'complete',
                            'methode'       => 'especes',
                            'date_paiement' => !empty($p['date']) ? \Carbon\Carbon::createFromFormat('d/m/Y', $p['date'])->toDateString() : now(),
                            'saisi_par'     => $user->id,
                        ]
                    );
                }
            }

            $this->info("✓ Restored: {$student->matricule} - {$student->nom} {$student->prenom}");
        }

        $this->info("Done! Student(s) successfully restored.");
        return 0;
    }
}
