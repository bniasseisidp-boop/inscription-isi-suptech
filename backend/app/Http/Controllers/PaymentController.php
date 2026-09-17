<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use App\Models\MoisDesactive;
use App\Models\StudentNotification;
use App\Services\WavePaymentService;
use App\Services\PDFService;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function __construct(
        private WavePaymentService $waveService,
        private PDFService $pdfService,
    ) {}

    /** Wave webhook endpoint */
    public function waveWebhook(Request $request)
    {
        $signature = $request->header('Wave-Signature');
        $payload   = $request->getContent();

        if (!$this->waveService->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $this->waveService->handleWebhook($request->all());

        return response()->json(['received' => true]);
    }

    /** Cashier list: all payments */
            public function index(Request $request)
    {
        $annee = $request->query('annee_scolaire', $request->query('annee_universitaire', $request->query('annee', '2026-2027')));

        $query = Payment::with(['student.filiere', 'student.license', 'saiseur']);

        if ($annee && $annee !== 'ALL') {
            if ($annee === '2026-2027') {
                $query->where(function ($q) {
                    $q->where('annee', '2026-2027')
                      ->orWhere(function ($sub) {
                          $sub->where(function ($sub2) {
                              $sub2->whereNull('annee')->orWhere('annee', '')->orWhere('annee', '2026-2027');
                          })->where(function ($sub3) {
                              $sub3->whereHas('student', function ($sq) {
                                  $sq->where('matricule', 'like', 'ISI-2026-%')
                                     ->orWhere('annee_scolaire', '2026-2027');
                              })->orWhereDate('date_paiement', '>=', '2026-08-01')
                                ->orWhereDate('created_at', '>=', '2026-08-01');
                          });
                      });
                });
            } elseif ($annee === 'ANCIENS') {
                $query->where(function ($q) {
                    $q->where('annee', '!=', '2026-2027')
                      ->orWhereHas('student', function ($sq) {
                          $sq->whereNotNull('dossiers_historique');
                      });
                });
            } else {
                $query->where(function ($q) use ($annee) {
                    $q->where('annee', $annee)
                      ->orWhere(function ($sub) use ($annee) {
                          $sub->where(function ($sub2) {
                              $sub2->whereNull('annee')->orWhere('annee', '');
                          })->whereHas('student', function ($sq) use ($annee) {
                              $sq->where('annee_scolaire', $annee)
                                 ->orWhere('dossiers_historique', 'like', '%"annee":"' . $annee . '"%');
                          });
                      });
                });
            }
        }

        $payments = $query
            ->when($request->search, fn($q) => $q->whereHas('student', function ($sq) use ($request) {
                $sq->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->latest('date_paiement')
            ->latest('id')
            ->paginate(30);

        return response()->json($payments);
    }

    /** Cashier manually records a payment — immediately complete */
    public function manualPayment(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type'       => 'required|in:inscription,mensualite,autre',
            'montant'    => 'required|numeric|min:1',
            'mois'       => 'required_if:type,mensualite|nullable|string',
            'methode'    => 'required|in:especes,virement,cheque,wave',
            'notes'      => 'nullable|string',
        ]);

        $student = Student::with('license')->findOrFail($request->student_id);

        if ($request->type === 'mensualite') {
            $erreurMois = $student->moisEstPayable($request->mois);
            if ($erreurMois) {
                return response()->json(['message' => $erreurMois], 422);
            }
        }

        // Frais annexes fixes (depuis site_settings)
        $settings       = DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmea      = floatval($settings['frais_amea']      ?? 10000);
        $fraisTenue     = floatval($settings['frais_tenue']     ?? 60000);
        $fraisAssurance = floatval($settings['frais_assurance'] ?? 10000);
        $fraisMensuel   = floatval($student->license?->frais_mensuel ?? 0);

        // Montant attendu selon le type
        $dejaPayeInscription = 0;
        $dernierMoisCle      = null;

        if ($request->type === 'inscription') {
            // frais_inscription sur la licence = TOTAL (scolarité + AMEA + tenue + assurance + dernier mois)
            $montantDu = floatval($student->license?->frais_inscription ?? 0);
            $dejaPayeInscription = floatval(
                Payment::where('student_id', $request->student_id)->where('type', 'inscription')->sum('montant')
            );
            $totalApresVersement = $dejaPayeInscription + floatval($request->montant);
            $statut = $totalApresVersement >= $montantDu ? 'complete' : 'partiel';
            $dernierMoisCle = $student->dernier_mois_cle;
        } elseif ($request->type === 'mensualite') {
            $montantDu   = $fraisMensuel;
            $avanceActuelle = floatval($student->avance_paiement ?? 0);
            // Montant effectif = versement + avance antérieure (positive = crédit, négative = déficit)
            $montantEffectif = floatval($request->montant) + $avanceActuelle;
            $statut = $montantEffectif >= $fraisMensuel ? 'complete' : 'partiel';
            // Nouvelle avance (positive = surplus reporté, négative = déficit reporté)
            $nouvelleAvance = round($montantEffectif - $fraisMensuel, 2);
        } else {
            $montantDu = floatval($request->montant);
            $statut    = 'complete';
        }

        // Libellé automatique
        $libelle = match($request->type) {
            'inscription' => "Frais d'inscription — " . ($student->license?->nom ?? ''),
            'mensualite'  => 'Mensualité ' . ($request->mois ?? date('Y-m')),
            default       => 'Paiement divers',
        };

        $payment = Payment::create([
            'student_id'   => $request->student_id,
            'type'         => $request->type,
            'libelle'      => $libelle,
            'montant'      => $request->montant,
            'mois'         => $request->mois,
            'annee'        => $student->annee_scolaire ?: '2026-2027',
            'statut'       => $statut,
            'methode'      => $request->methode,
            'date_paiement'=> now(),
            'saisi_par'    => $request->user()->id,
            'notes'        => $request->notes,
        ]);

        // Mettre a jour la comptabilite globale de l'etudiant (arrieres / total paye)
        $payeAvant = floatval($student->compta_total_paye ?? 0);
        $soldeAvant = floatval($student->compta_solde_restant ?? 0);
        $nouveauPaye = $payeAvant + floatval($request->montant);
        $nouveauSolde = max(0, $soldeAvant - floatval($request->montant));
        $student->update([
            'compta_total_paye'    => $nouveauPaye,
            'compta_solde_restant' => $nouveauSolde,
            'compta_est_en_regle'  => $nouveauSolde <= 0,
        ]);

        // ── Inscription : activation ──
        if ($request->type === 'inscription' && $statut === 'complete') {
            $student->update([
                'inscription_payee'  => true,
                'statut_inscription' => 'accepte',
                // Le dernier mois est inclus dans l'inscription — géré automatiquement dans etudiantSuivi
            ]);
            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '✅ Paiement confirmé — Inscription validée !',
                'message'    => "Votre paiement d'inscription a été enregistré (frais de scolarité + AMEA + tenue + assurance + dernier mois inclus : " . ($dernierMoisCle ?? '—') . "). Votre compte étudiant est maintenant actif. Bienvenue à ISI SUPTECH !",
                'type'       => 'success',
            ]);

            // Envoie l'attestation d'inscription (+ fiche d'inscription) par email —
            // le dossier est désormais officiellement finalisé.
            if ($student->user?->email) {
                try {
                    $freshStudent = $student->fresh(['filiere', 'license', 'user']);
                    $attestationPath = Storage::disk('public')->path($this->pdfService->generateAttestationInscription($freshStudent));
                    $fichePath        = Storage::disk('public')->path($this->pdfService->generateFicheInscription($freshStudent));
                    \Illuminate\Support\Facades\Mail::to($student->user->email)
                        ->send(new \App\Mail\InscriptionPayee($freshStudent, $attestationPath, $fichePath));
                } catch (\Exception $e) {
                    \Log::warning('Email inscription payée: ' . $e->getMessage());
                }
            }
        } elseif ($request->type === 'inscription' && $statut === 'partiel') {
            // Reporter le solde restant en déficit sur avance_paiement pour les mois suivants
            $soldeRestant   = $montantDu - ($dejaPayeInscription + floatval($request->montant));
            $avanceActuelle = floatval($student->avance_paiement ?? 0);
            $student->update(['avance_paiement' => round($avanceActuelle - $soldeRestant, 2)]);
            StudentNotification::create([
                'student_id' => $student->id,
                'titre'      => '⚠️ Paiement partiel — Solde reporté sur les mensualités',
                'message'    => "Versement de " . number_format($request->montant, 0, ',', ' ') . " FCFA enregistré. Solde restant dû : " . number_format($soldeRestant, 0, ',', ' ') . " FCFA — ce montant sera déduit de vos mensualités suivantes.",
                'type'       => 'warning',
            ]);
        }

        // ── Mensualité : mettre à jour l'avance/déficit ──
        if ($request->type === 'mensualite') {
            $student->update(['avance_paiement' => $nouvelleAvance]);
            if ($nouvelleAvance < 0) {
                StudentNotification::create([
                    'student_id' => $student->id,
                    'titre'      => '⚠️ Paiement partiel — Déficit reporté',
                    'message'    => "Versement de " . number_format($request->montant, 0, ',', ' ') . " FCFA enregistré. Déficit de " . number_format(abs($nouvelleAvance), 0, ',', ' ') . " FCFA reporté sur le mois suivant.",
                    'type'       => 'warning',
                ]);
            } elseif ($nouvelleAvance > 0) {
                StudentNotification::create([
                    'student_id' => $student->id,
                    'titre'      => '✅ Mensualité payée — Avance reportée',
                    'message'    => "Mensualité réglée. Avance de " . number_format($nouvelleAvance, 0, ',', ' ') . " FCFA reportée sur le mois suivant.",
                    'type'       => 'success',
                ]);
            }
        }

        // Générer le reçu PDF
        try {
            $this->pdfService->generateReceipt($payment->load('student.license.filiere'), true);
        } catch (\Exception $e) {
            \Log::warning('PDF reçu: ' . $e->getMessage());
        }

        $payment->refresh();

        ActivityLogger::log(
            $request->user(), 'payment.create',
            "Paiement de " . number_format($payment->montant, 0, ',', ' ') . " FCFA (" . $payment->type . ($payment->mois ? ' — ' . $payment->mois : '') . ") pour {$student->prenom} {$student->nom}",
            $payment, ['statut' => $payment->statut, 'methode' => $payment->methode]
        );

        $extraData = [];
        if ($request->type === 'inscription') {
            $totalInsc = $montantDu;
            $fraisScolarite = max(0, $totalInsc - $fraisAmea - $fraisTenue - $fraisAssurance - $fraisMensuel);
            $extraData['inscription_detail'] = [
                'frais_scolarite'    => $fraisScolarite,
                'frais_amea'         => $fraisAmea,
                'frais_tenue'        => $fraisTenue,
                'frais_assurance'    => $fraisAssurance,
                'frais_dernier_mois' => $fraisMensuel,
                'total_du'           => $totalInsc,
                'total_paye'         => $dejaPayeInscription + floatval($request->montant),
                'restant'            => max(0, $totalInsc - ($dejaPayeInscription + floatval($request->montant))),
                'dernier_mois_cle'   => $dernierMoisCle,
            ];
        }
        if ($request->type === 'mensualite') {
            $extraData['avance_paiement'] = $nouvelleAvance;
        }

        return response()->json(array_merge([
            'message'  => 'Paiement enregistré avec succès',
            'payment'  => $payment->load(['student.user', 'student.filiere', 'student.license']),
            'recu_url' => $payment->recu_pdf_path
                ? asset('storage/' . $payment->recu_pdf_path)
                : null,
        ], $extraData));
    }

    /**
     * Paiement anticipé réparti sur plusieurs mois en une seule saisie.
     * Ex: 100 000 FCFA versés pour Janvier+Février (mensualité 70 000) → Janvier reçoit
     * 70 000 (complet), Février reçoit les 30 000 restants (partiel) ; le solde de Février
     * (40 000) est reporté en déficit via avance_paiement et se rattrapera au paiement
     * suivant (Mars) — jamais un 2e paiement n'est créé pour un même mois.
     */
    public function manualPaymentMultiMois(Request $request)
    {
        $request->validate([
            'student_id'    => 'required|exists:students,id',
            'mois'          => 'required|array|min:1',
            'mois.*'        => 'string',
            'montant_total' => 'required|numeric|min:1',
            'methode'       => 'required|in:especes,virement,cheque,wave',
            'notes'         => 'nullable|string',
        ]);

        $student = Student::with('license')->findOrFail($request->student_id);
        $moisTries = collect($request->mois)->unique()->sort()->values();

        $dejaValides = [];
        foreach ($moisTries as $mois) {
            $erreur = $student->moisEstPayable($mois, $dejaValides);
            if ($erreur) {
                return response()->json(['message' => "$mois : $erreur"], 422);
            }
            $dejaValides[] = $mois;
        }

        $fraisMensuel = floatval($student->license?->frais_mensuel ?? 0);
        $poolRestant  = floatval($request->montant_total);
        $paiements    = [];
        $avanceFinale = 0; // 0 = tout tombe juste ; négatif = déficit sur le dernier mois traité ; positif = surplus reporté
        $groupeId     = (string) \Illuminate\Support\Str::uuid();

        foreach ($moisTries as $mois) {
            if ($poolRestant <= 0) break;

            $verse  = min($poolRestant, $fraisMensuel);
            $statut = $verse >= $fraisMensuel ? 'complete' : 'partiel';

            $paiements[] = Payment::create([
                'student_id'    => $student->id,
                'groupe_id'     => $groupeId,
                'type'          => 'mensualite',
                'libelle'       => 'Mensualité ' . $mois . ' (paiement anticipé)',
                'montant'       => $verse,
                'mois'          => $mois,
                'annee'        => $student->annee_scolaire ?: '2026-2027',
                'statut'        => $statut,
                'methode'       => $request->methode,
                'date_paiement' => now(),
                'saisi_par'     => $request->user()->id,
                'notes'         => $request->notes,
            ]);

            $poolRestant  = round($poolRestant - $verse, 2);
            $avanceFinale = round($verse - $fraisMensuel, 2); // 0 si complet, négatif si partiel
        }

        // S'il reste de l'argent après avoir couvert tous les mois sélectionnés (déjà tous
        // complets), ce surplus devient un crédit reporté sur le mois suivant.
        if ($poolRestant > 0) {
            $avanceFinale = $poolRestant;
        }

        $student->update(['avance_paiement' => $avanceFinale]);

        // Un seul reçu consolidé pour tout le groupe (pas un reçu par mois).
        if (!empty($paiements)) {
            try {
                $this->pdfService->generateReceipt($paiements[0]->load('student.license.filiere'), true);
            } catch (\Exception $e) {
                \Log::warning('PDF reçu (multi-mois): ' . $e->getMessage());
            }
        }

        $moisComplets = collect($paiements)->where('statut', 'complete')->pluck('mois')->values();
        $moisPartiel  = collect($paiements)->firstWhere('statut', 'partiel');

        StudentNotification::create([
            'student_id' => $student->id,
            'titre'      => '✅ Paiement anticipé enregistré',
            'message'    => 'Versement de ' . number_format($request->montant_total, 0, ',', ' ') . ' FCFA réparti sur ' . $moisTries->count() . ' mois.'
                . ($moisPartiel ? ' Le mois ' . $moisPartiel->mois . ' est partiellement payé — le solde sera reporté sur le mois suivant.' : ''),
            'type' => 'success',
        ]);

        collect($paiements)->each(fn ($p) => $p->load(['student.user', 'student.filiere', 'student.license']));

        ActivityLogger::log(
            $request->user(), 'payment.create.multi',
            "Paiement anticipé de " . number_format($request->montant_total, 0, ',', ' ') . " FCFA réparti sur " . $moisTries->count() . " mois pour {$student->prenom} {$student->nom}",
            $paiements[0] ?? null, ['mois' => $moisTries->values(), 'avance_paiement' => $avanceFinale]
        );

        return response()->json([
            'message'   => count($paiements) . ' mensualité(s) enregistrée(s)',
            'paiements' => $paiements,
            'avance_paiement' => $avanceFinale,
        ]);
    }

    /**
     * Corriger un paiement déjà saisi (erreur de caisse) — montant et/ou mode de paiement.
     * Le mois et le type ne sont pas modifiables ici (cf. moisEstPayable) ; pour une
     * mensualité, seul le dernier paiement du type du client peut être corrigé, car
     * avance_paiement est un solde cumulé qui dépend de l'ordre des versements.
     */
    public function updatePayment(Request $request, Payment $payment)
    {
        // La caisse doit avoir une permission admin approuvée (et non encore utilisée)
        // pour CE paiement précis avant de pouvoir le corriger — l'admin, lui, peut
        // toujours corriger directement. La permission est consommée après usage.
        $editRequest = null;
        if ($request->user()->role === 'cashier') {
            $editRequest = \App\Models\PaymentEditRequest::where('payment_id', $payment->id)
                ->where('requested_by', $request->user()->id)
                ->where('statut', 'approuve')
                ->latest('decided_at')
                ->first();

            if (!$editRequest) {
                return response()->json([
                    'message' => "Vous n'avez pas la permission de modifier ce paiement — demandez l'autorisation à l'administrateur.",
                ], 403);
            }
        }

        $request->validate([
            'montant' => 'required|numeric|min:1',
            'methode' => 'required|in:especes,virement,cheque,wave',
            'notes'   => 'nullable|string',
        ]);

        $student = $payment->student()->with('license')->first();
        $ancienMontant = floatval($payment->montant);
        $nouveauMontant = floatval($request->montant);

        if ($payment->type === 'mensualite') {
            $dernierPaiementId = $student->payments()
                ->where('type', 'mensualite')->latest('id')->value('id');
            if ($dernierPaiementId !== $payment->id) {
                return response()->json([
                    'message' => "Seul le dernier paiement de mensualité peut être corrigé ici — contactez l'administrateur pour un paiement plus ancien.",
                ], 422);
            }
            $fraisMensuel   = floatval($student->license?->frais_mensuel ?? 0);
            $ancienDelta    = $ancienMontant - $fraisMensuel;
            $avanceAvant    = floatval($student->avance_paiement ?? 0) - $ancienDelta;
            $montantEffectif = $nouveauMontant + $avanceAvant;
            $payment->statut = $montantEffectif >= $fraisMensuel ? 'complete' : 'partiel';
            $student->update(['avance_paiement' => round($montantEffectif - $fraisMensuel, 2)]);
        } elseif ($payment->type === 'inscription') {
            $montantDu = floatval($student->license?->frais_inscription ?? 0);
            $autresPaiements = $student->payments()
                ->where('type', 'inscription')->where('id', '!=', $payment->id)->sum('montant');
            $totalApres = floatval($autresPaiements) + $nouveauMontant;
            $payment->statut = $totalApres >= $montantDu ? 'complete' : 'partiel';
            $student->update([
                'inscription_payee'  => $payment->statut === 'complete',
                'statut_inscription' => $payment->statut === 'complete' ? 'accepte' : 'en_attente_paiement',
            ]);
        }

        $payment->montant = $nouveauMontant;
        $payment->methode = $request->methode;
        $payment->notes   = trim(
            ($payment->notes ? $payment->notes . "\n" : '')
            . '[Corrigé le ' . now()->format('d/m/Y H:i') . ' par ' . $request->user()->name
            . '] Montant : ' . number_format($ancienMontant, 0, ',', ' ') . ' → ' . number_format($nouveauMontant, 0, ',', ' ') . ' FCFA'
            . ($request->notes ? ' — ' . $request->notes : '')
        );
        $payment->save();

        if ($editRequest) {
            $editRequest->update(['statut' => 'utilise']);
        }

        ActivityLogger::log(
            $request->user(), 'payment.update',
            "Correction paiement #{$payment->id} : " . number_format($ancienMontant, 0, ',', ' ') . " → " . number_format($nouveauMontant, 0, ',', ' ') . " FCFA pour {$student->prenom} {$student->nom}",
            $payment, ['ancien_montant' => $ancienMontant, 'nouveau_montant' => $nouveauMontant, 'via_permission' => (bool) $editRequest]
        );

        try {
            $this->pdfService->generateReceipt($payment->load('student.license.filiere'), false);
        } catch (\Exception $e) {
            \Log::warning('PDF reçu (correction): ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Paiement corrigé avec succès',
            'payment' => $payment->fresh()->load(['student.user', 'student.filiere', 'student.license']),
        ]);
    }

    /** La caisse demande à l'admin la permission de corriger un paiement précis. */
    public function demanderModificationPaiement(Request $request, Payment $payment)
    {
        $request->validate(['motif' => 'nullable|string|max:500']);

        // Une demande en attente existe déjà pour ce paiement par cette même caisse : pas de doublon.
        $existante = \App\Models\PaymentEditRequest::where('payment_id', $payment->id)
            ->where('requested_by', $request->user()->id)
            ->where('statut', 'en_attente')
            ->first();
        if ($existante) {
            return response()->json(['message' => 'Une demande est déjà en attente pour ce paiement.', 'demande' => $existante], 422);
        }

        $demande = \App\Models\PaymentEditRequest::create([
            'payment_id'   => $payment->id,
            'requested_by' => $request->user()->id,
            'motif'        => $request->motif,
            'statut'       => 'en_attente',
        ]);

        ActivityLogger::log(
            $request->user(), 'payment.edit_request',
            "Demande de modification pour le paiement #{$payment->id}" . ($request->motif ? ' — ' . $request->motif : ''),
            $payment
        );

        return response()->json(['message' => 'Demande envoyée à l\'administrateur.', 'demande' => $demande], 201);
    }

    /** Statut de la demande de modification en cours pour un paiement (côté caisse). */
    public function statutDemandeModification(Request $request, Payment $payment)
    {
        $demande = \App\Models\PaymentEditRequest::where('payment_id', $payment->id)
            ->where('requested_by', $request->user()->id)
            ->latest()
            ->first();

        return response()->json(['demande' => $demande]);
    }

    /** Students waiting for payment (statut en_attente_paiement) */
    public function etudiantsAttentePaiement(Request $request)
    {
        $annee = $request->annee_scolaire ?? '2026-2027';
        $query = Student::with(['filiere', 'license', 'user'])
            ->where('statut_inscription', 'en_attente_paiement')
            ->when($annee && $annee !== 'ALL', fn($q) => $q->where('annee_scolaire', $annee))
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->latest();

        return response()->json($query->get());
    }

    /** Mois désactivés list (for cashier to know which months to skip) */
    public function moisDesactives()
    {
        return response()->json(MoisDesactive::orderBy('mois')->pluck('mois'));
    }

    /** Stream receipt PDF inline (called with Bearer token via fetch/blob) */
    public function downloadReceipt(Payment $payment)
    {
        $path     = $this->pdfService->generateReceipt($payment, false);
        $fullPath = Storage::disk('public')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Reçu introuvable'], 404);
        }

        $payment->load('student');
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', ($payment->student->nom ?? 'etudiant') . '_' . ($payment->student->prenom ?? '')));
        $moisSlug = $payment->mois ? '_' . $payment->mois : '';
        $fname = 'recu_ISI_' . $slug . $moisSlug . '_' . str_pad($payment->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $fname . '"',
        ]);
    }

    /** List students who haven't paid the given month (default: current month, callable from 5th) */
    public function impayesMois(Request $request)
    {
        $mois  = $request->input('mois', now()->format('Y-m'));
        $annee = $request->query('annee_scolaire', $request->input('annee_scolaire', '2026-2027'));

        // All active students for this academic year
        $tous = \App\Models\Student::with(['filiere', 'license', 'payments'])
            ->where('inscription_payee', true)
            ->where('statut_inscription', 'accepte')
            ->when($annee && $annee !== 'ALL', fn($q) => $q->where('annee_scolaire', $annee))
            ->get();

        $impaye = $tous->filter(fn ($s) => in_array($mois, $s->mois_non_payes, true))->values();

        return response()->json([
            'mois'   => $mois,
            'count'  => $impaye->count(),
            'data'   => $impaye,
        ]);
    }

    public function impayesMoisPdf(Request $request)
    {
        $mois  = $request->input('mois', now()->format('Y-m'));
        $annee = $request->query('annee_scolaire', $request->input('annee_scolaire', '2026-2027'));

        $tous = \App\Models\Student::with(['filiere', 'license', 'user', 'payments'])
            ->where('inscription_payee', true)
            ->where('statut_inscription', 'accepte')
            ->when($annee && $annee !== 'ALL', fn($q) => $q->where('annee_scolaire', $annee))
            ->get();

        $etudiants = $tous->filter(fn ($s) => in_array($mois, $s->mois_non_payes, true))->values()->toArray();

        $path     = $this->pdfService->generateImpayesPdf($etudiants, $mois);
        $fullPath = Storage::disk('public')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="impayes_ISI_' . $mois . '.pdf"',
        ]);
    }

    public function downloadBrouillard(Request $request)
    {
        $date = $request->input('date') ? \Carbon\Carbon::parse($request->input('date')) : now();

        $path     = $this->pdfService->generateBrouillardEncaissement($date, $request->user()->name);
        $fullPath = Storage::disk('public')->path($path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="brouillard_ISI_' . $date->format('Ymd') . '.pdf"',
        ]);
    }

    /**
     * Facture proforma — pour un futur candidat pas encore inscrit dont une
     * entreprise doit decider de la prise en charge sur la base de ce document.
     */
    public function factureProforma(Request $request)
    {
        $validated = $request->validate([
            'license_id'   => 'required|exists:licenses,id',
            'entreprise'   => 'required|string|max:150',
            'beneficiaire' => 'required|string|max:150',
        ]);

        $license = \App\Models\License::findOrFail($validated['license_id']);

        $result   = $this->pdfService->generateFactureProforma(
            $license, $validated['entreprise'], $validated['beneficiaire'], $request->user()
        );
        $fullPath = Storage::disk('public')->path($result['path']);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        ActivityLogger::log(
            $request->user(), 'facture_proforma.create',
            "Facture proforma #{$result['reference']} generee pour {$validated['beneficiaire']} ({$validated['entreprise']})"
        );

        return response()->file($fullPath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="facture_proforma_' . $result['reference'] . '.pdf"',
        ]);
    }

    /** List students for cashier browser — inclut en_attente pour que le caissier trouve tout étudiant pré-inscrit */
    public function etudiantsList(Request $request)
    {
        $annee = $request->query('annee_scolaire') 
              ?? $request->query('annee_universitaire') 
              ?? $request->query('annee') 
              ?? $request->input('annee_scolaire') 
              ?? $request->input('annee_universitaire') 
              ?? $request->input('annee');

        $statutsDisponibles = ['accepte', 'en_attente_paiement', 'en_attente'];
        $statuts = ($request->statut && in_array($request->statut, $statutsDisponibles))
            ? [$request->statut]
            : ['accepte'];

        $query = Student::with(['filiere', 'license', 'user'])
            ->whereIn('statut_inscription', $statuts)
            ->when($annee && $annee !== 'ALL', fn($q) => $q->where('annee_scolaire', $annee))
            ->when($request->filiere_id, fn($q) => $q->where('filiere_id', $request->filiere_id))
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('nom', 'like', '%' . $request->search . '%')
                   ->orWhere('prenom', 'like', '%' . $request->search . '%')
                   ->orWhere('matricule', 'like', '%' . $request->search . '%');
            }))
            ->latest();

        return response()->json($query->paginate($request->per_page ?? 25));
    }

            public function stats(Request $request)
    {
        $annee = $request->query('annee_scolaire') 
              ?? $request->query('annee_universitaire') 
              ?? $request->query('annee') 
              ?? $request->input('annee_scolaire') 
              ?? $request->input('annee_universitaire') 
              ?? $request->input('annee');
              
        if (!$annee) {
            $annee = '2026-2027';
        }
        
        $today = now()->toDateString();
        $thisMonth = now()->month;
        $thisYear  = now()->year;
        
        $pQuery = Payment::query();
        if (\Illuminate\Support\Facades\Schema::hasColumn('payments', 'statut')) {
            $pQuery->whereIn('statut', ['complete', 'valide', 'succes', 'effectue', 'reussi', 'PAYE', 'paye']);
        }
        
        if ($annee === '2026-2027' || !$annee) {
            $pQuery->where(function ($q) {
                $q->where('annee', '2026-2027')
                  ->orWhere(function ($sub) {
                      $sub->where(function ($sub2) {
                          $sub2->whereNull('annee')->orWhere('annee', '')->orWhere('annee', '2026-2027');
                      })->where(function ($sub3) {
                          $sub3->whereHas('student', function ($sq) {
                              $sq->where('matricule', 'like', 'ISI-2026-%')
                                 ->orWhere('annee_scolaire', '2026-2027');
                          })->orWhereDate('date_paiement', '>=', '2026-08-01')
                            ->orWhereDate('created_at', '>=', '2026-08-01');
                      });
                  });
            });
        } elseif ($annee === 'ANCIENS') {
            $pQuery->where(function ($q) {
                $q->where('annee', '!=', '2026-2027')
                  ->orWhereHas('student', function ($sq) {
                      $sq->whereNotNull('dossiers_historique');
                  });
            });
        } elseif ($annee !== 'ALL') {
            $pQuery->where(function ($q) use ($annee) {
                $q->where('annee', $annee)
                  ->orWhere(function ($sub) use ($annee) {
                      $sub->where(function ($sub2) {
                          $sub2->whereNull('annee')->orWhere('annee', '');
                      })->whereHas('student', function ($sq) use ($annee) {
                          $sq->where('annee_scolaire', $annee)
                             ->orWhere('dossiers_historique', 'like', '%"annee":"' . $annee . '"%');
                      });
                  });
            });
        }

        $sQuery = Student::query();
        if ($annee === '2026-2027' || !$annee) {
            $sQuery->where(function ($q) {
                $q->where('annee_scolaire', '2026-2027')
                  ->orWhere('matricule', 'like', 'ISI-2026-%')
                  ->orWhere(function ($sub) {
                      $sub->whereNull('dossiers_historique')
                          ->whereIn('statut_inscription', ['en_attente', 'en_attente_paiement', 'accepte']);
                  });
            });
        } elseif ($annee !== 'ALL') {
            $sQuery->where('annee_scolaire', $annee);
        }

        $effectiveTotalAnnee = (float)(clone $pQuery)->sum('montant');
        $totalInscrits = (clone $sQuery)->where('statut_inscription', 'accepte')->count();
        $totalReliquats = (clone $sQuery)->sum('compta_solde_restant');

        $totalJour = (clone $pQuery)->where(function ($q) use ($today) {
            $q->whereDate('date_paiement', $today)
              ->orWhere(function ($sub) use ($today) {
                  $sub->whereNull('date_paiement')->whereDate('created_at', $today);
              });
        })->sum('montant');

        $totalMois = (clone $pQuery)->where(function ($q) use ($thisYear, $thisMonth) {
            $q->where(function ($q1) use ($thisYear, $thisMonth) {
                $q1->whereYear('date_paiement', $thisYear)->whereMonth('date_paiement', $thisMonth);
            })->orWhere(function ($q2) use ($thisYear, $thisMonth) {
                $q2->whereNull('date_paiement')->whereYear('created_at', $thisYear)->whereMonth('created_at', $thisMonth);
            });
        })->sum('montant');

        $countJour = (clone $pQuery)->where(function ($q) use ($today) {
            $q->whereDate('date_paiement', $today)
              ->orWhere(function ($sub) use ($today) {
                  $sub->whereNull('date_paiement')->whereDate('created_at', $today);
              });
        })->count();

        $countMois = (clone $pQuery)->where(function ($q) use ($thisYear, $thisMonth) {
            $q->where(function ($q1) use ($thisYear, $thisMonth) {
                $q1->whereYear('date_paiement', $thisYear)->whereMonth('date_paiement', $thisMonth);
            })->orWhere(function ($q2) use ($thisYear, $thisMonth) {
                $q2->whereNull('date_paiement')->whereYear('created_at', $thisYear)->whereMonth('created_at', $thisMonth);
            });
        })->count();

        return response()->json([
            'total_jour'      => $totalJour,
            'total_mois'      => $totalMois,
            'total_annee'     => $effectiveTotalAnnee,
            'total_reliquats' => (float)$totalReliquats,
            'count_jour'      => $countJour,
            'count_mois'      => $countMois,
            'count_annee'     => (clone $pQuery)->count(),
            'total_attente'   => (clone $sQuery)->where('statut_inscription', 'en_attente_paiement')->count(),
            'total_inscrits'  => $totalInscrits,
            'annee_selectionnee' => $annee,
        ]);
    }


    public function inscriptionDetails(Student $student)
    {
        $student->loadMissing(['license.filiere', 'payments']);
        $license = $student->license;

        $settings       = \Illuminate\Support\Facades\DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmea      = floatval($settings['frais_amea']      ?? 10000);
        $fraisTenueStd  = floatval($settings['frais_tenue']     ?? 60000);
        $fraisAssurance = floatval($settings['frais_assurance'] ?? 10000);
        $fraisMensuel   = floatval($license?->frais_mensuel ?? 0);

        $isReinscription = !empty($student->dossiers_historique) || ($license?->frais_reinscription && $license->frais_reinscription > 0);
        $fraisTenue = $isReinscription ? 0 : $fraisTenueStd;

        $totalDu = $isReinscription
            ? floatval($license?->frais_reinscription ?: max(0, floatval($license?->frais_inscription ?? 0) - $fraisTenueStd))
            : floatval($license?->frais_inscription ?? 0);

        $fraisScolarite = max(0, $totalDu - $fraisAmea - $fraisTenue - $fraisAssurance - $fraisMensuel);
        $dejaPaye = floatval($student->payments()->where('type', 'inscription')->whereIn('statut', ['complete', 'partiel'])->sum('montant'));
        $restant = max(0, $totalDu - $dejaPaye);

        return response()->json([
            'is_reinscription'   => $isReinscription,
            'frais_scolarite'    => $fraisScolarite,
            'frais_amea'         => $fraisAmea,
            'frais_tenue'        => $fraisTenue,
            'frais_assurance'    => $fraisAssurance,
            'frais_dernier_mois' => $fraisMensuel,
            'total_du'           => $totalDu,
            'deja_paye'          => $dejaPaye,
            'restant'            => $restant,
            'dernier_mois_cle'   => $student->dernier_mois_cle,
        ]);
    }

    public function etudiantSuivi($id)
    {
        $student = Student::with(['license.filiere', 'payments'])->findOrFail($id);
        return response()->json([
            'avance_paiement' => floatval($student->avance_paiement ?? 0),
            'mois_payes'      => count($student->mois_payes_cle ?? []),
            'mois_total'      => 10,
            'solde_restant'   => floatval($student->compta_solde_restant ?? 0),
            'mois'            => $student->calendrier_mois ?? [],
        ]);
    }
}
