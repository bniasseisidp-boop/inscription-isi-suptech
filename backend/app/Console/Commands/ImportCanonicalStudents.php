<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use App\Models\Payment;
use App\Models\Note;
use App\Models\Matiere;
use App\Models\Filiere;
use App\Models\License;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ImportCanonicalStudents extends Command
{
    protected $signature = 'app:import-canonical';
    protected $description = 'Import all 2,193 canonical students, payments, and notes into the database';

    public function handle()
    {
        $this->info('Starting importation of 2,193 canonical students...');

        $paths = [
            storage_path('app/canonical_all_students.json'),
            storage_path('canonical_all_students.json'),
            base_path('storage/app/canonical_all_students.json'),
            base_path('../canonical_all_students.json'),
        ];

        $canonicalFile = null;
        foreach ($paths as $p) {
            if (file_exists($p)) {
                $canonicalFile = $p;
                break;
            }
        }

        if (!$canonicalFile) {
            $this->error('File canonical_all_students.json not found in storage/app/ !');
            return 1;
        }

        $this->info("Found canonical file: $canonicalFile (" . filesize($canonicalFile) . " bytes)");
        $studentsData = json_decode(file_get_contents($canonicalFile), true);
        $total = count($studentsData);
        $this->info("Total students to process: $total");

        $filiereMap = [];
        foreach (Filiere::all() as $f) {
            $filiereMap[strtoupper(trim($f->nom))] = $f->id;
            $filiereMap[strtoupper(trim($f->code))] = $f->id;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $imported = 0;
        $updated = 0;

        foreach ($studentsData as $item) {
            $matricule = trim($item['matricule'] ?? '');
            if (!$matricule) {
                $bar->advance();
                continue;
            }

            $nom = trim($item['nom'] ?? '');
            $prenom = trim($item['prenom'] ?? '');
            $annee = trim($item['annee'] ?? $item['annee_universitaire'] ?? '2024-2025');
            $filiereNom = trim($item['filiere'] ?? '');
            $niveau = trim($item['niveau'] ?? 'Licence 1');

            // Find or create filiere
            $filiereId = null;
            if ($filiereNom) {
                $key = strtoupper($filiereNom);
                if (isset($filiereMap[$key])) {
                    $filiereId = $filiereMap[$key];
                } else {
                    $newFil = Filiere::firstOrCreate(
                        ['nom' => $filiereNom],
                        ['code' => substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $filiereNom)), 0, 8)]
                    );
                    $filiereMap[$key] = $newFil->id;
                    $filiereId = $newFil->id;
                }
            }

            // Create/Find User
            $email = trim($item['email'] ?? '');
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $safeMat = preg_replace('/[^A-Za-z0-9]/', '', strtolower($matricule));
                $email = "etudiant.{$safeMat}@isi-suptech.sn";
            }

            $user = User::where('email', $email)->first();
            if (!$user) {
                $user = User::create([
                    'name' => "$prenom $nom",
                    'email' => $email,
                    'password' => Hash::make('IsiPass2026!'),
                    'role' => 'student',
                ]);
            }

            // Update or Create Student
            $student = Student::where('matricule', $matricule)->first();
            $dataToSave = [
                'user_id' => $user->id,
                'matricule' => $matricule,
                'nom' => $nom,
                'prenom' => $prenom,
                'sexe' => $item['sexe'] ?? 'M',
                'date_naissance' => !empty($item['date_naissance']) ? date('Y-m-d', strtotime(str_replace('/', '-', $item['date_naissance']))) : null,
                'lieu_naissance' => $item['lieu_naissance'] ?? 'Dakar',
                'adresse' => $item['adresse'] ?? 'Dakar',
                'nationalite' => $item['nationalite'] ?? 'Sénégalaise',
                'telephone' => $item['telephone'] ?? '+221',
                'filiere_id' => $filiereId,
                'niveau_entree' => $niveau,
                'type_inscription' => 'Privée',
                'annee_scolaire' => $annee,
                'statut_inscription' => 'accepte',
                'inscription_payee' => true,
                'compta_debit_total' => (float)($item['compta_debit_total'] ?? 0),
                'compta_total_paye' => (float)($item['compta_total_paye'] ?? 0),
                'compta_solde_restant' => (float)($item['compta_solde_restant'] ?? 0),
                'moyenne_generale' => (float)($item['moyenne_generale'] ?? 0),
                'credits_total' => (int)($item['credits_total'] ?? 0),
                'id_cc' => $item['id_cc'] ?? null,
            ];

            if ($student) {
                $student->update($dataToSave);
                $updated++;
            } else {
                $student = Student::create($dataToSave);
                $imported++;
            }

            // Import Payments
            if (!empty($item['paiements']) && is_array($item['paiements'])) {
                foreach ($item['paiements'] as $pay) {
                    $montant = (float)($pay['montant'] ?? 0);
                    if ($montant <= 0) continue;

                    $datePaiement = !empty($pay['date']) ? date('Y-m-d H:i:s', strtotime(str_replace('/', '-', $pay['date']) . ' ' . ($pay['heure'] ?? '12:00:00'))) : now();
                    $mois = $pay['mois'] ?? 'Mensualité';
                    $txId = !empty($pay['id_recette']) ? "REC-{$pay['id_recette']}" : null;

                    Payment::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'wave_transaction_id' => $txId,
                        ],
                        [
                            'type' => (stripos($pay['nature'] ?? '', 'inscription') !== false) ? 'inscription' : 'mensualite',
                            'montant' => $montant,
                            'mois' => $mois,
                            'annee' => $annee,
                            'statut' => 'complete',
                            'date_paiement' => $datePaiement,
                            'methode' => (stripos($pay['mode'] ?? '', 'ch') !== false) ? 'cheque' : ((stripos($pay['mode'] ?? '', 'vir') !== false) ? 'virement' : 'especes'),
                            'notes' => 'Nature: ' . ($pay['nature'] ?? 'Paiement') . ' | Caissier: ' . ($pay['caissier'] ?? 'superviseur'),
                        ]
                    );
                }
            }

            // Import Modules and Notes
            if (!empty($item['modules']) && is_array($item['modules'])) {
                foreach ($item['modules'] as $mod) {
                    if (!empty($mod['matieres']) && is_array($mod['matieres'])) {
                        foreach ($mod['matieres'] as $mat) {
                            $matNom = trim($mat['nom'] ?? '');
                            if (!$matNom) continue;

                            $matiere = Matiere::firstOrCreate(
                                ['nom' => $matNom],
                                [
                                    'code' => substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $matNom)), 0, 10),
                                    'coefficient' => (int)($mat['coeff'] ?? 2),
                                    'filiere_id' => $filiereId,
                                ]
                            );

                            $cc = isset($mat['cc']) && $mat['cc'] !== '' && $mat['cc'] !== null ? (float)$mat['cc'] : null;
                            $exam = isset($mat['examen']) && $mat['examen'] !== '' && $mat['examen'] !== null ? (float)$mat['examen'] : null;

                            Note::updateOrCreate(
                                [
                                    'student_id' => $student->id,
                                    'matiere_id' => $matiere->id,
                                ],
                                [
                                    'note_cc' => $cc,
                                    'note_examen' => $exam,
                                    'semestre' => (stripos($mod['nom'] ?? '', 'Semestre 2') !== false || stripos($mod['code'] ?? '', 'S2') !== false) ? 'S2' : 'S1',
                                    'annee_universitaire' => $annee,
                                ]
                            );
                        }
                    }
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Import finished! Created: $imported | Updated: $updated | Total students in DB: " . Student::count());
        return 0;
    }
}