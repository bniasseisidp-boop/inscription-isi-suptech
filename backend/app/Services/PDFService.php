<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReceipt;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Mail\InscriptionAccepted;

class PDFService
{
    private array $moisNoms = [
        '01' => 'Janvier',  '02' => 'Février',  '03' => 'Mars',
        '04' => 'Avril',    '05' => 'Mai',       '06' => 'Juin',
        '07' => 'Juillet',  '08' => 'Août',      '09' => 'Septembre',
        '10' => 'Octobre',  '11' => 'Novembre',  '12' => 'Décembre',
    ];

    private function moisLabel(string $cle): string
    {
        $y = substr($cle, 0, 4);
        $m = substr($cle, 5, 2);
        return ($this->moisNoms[$m] ?? $m) . ' ' . $y;
    }

    private function montantEnLettres(float $montant): string
    {
        $unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
            'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept',
            'dix-huit', 'dix-neuf'];
        $dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
            'soixante', 'quatre-vingt', 'quatre-vingt'];

        $n = intval($montant);
        if ($n === 0) return 'zéro franc CFA';

        $toWords = function (int $n) use (&$toWords, $unites, $dizaines): string {
            if ($n < 20)  return $unites[$n];
            if ($n < 100) {
                $d = intdiv($n, 10); $u = $n % 10;
                if ($d === 7 || $d === 9) { $u += 10; $d--; }
                $lien = ($u === 1 && $d < 8) ? ' et ' : ($u ? '-' : '');
                $suf  = ($d === 8 && $u === 0) ? 's' : '';
                return $dizaines[$d] . $suf . ($u ? $lien . $unites[$u] : '');
            }
            if ($n < 1000) {
                $c = intdiv($n, 100); $r = $n % 100;
                $pre = $c === 1 ? 'cent' : $toWords($c) . ' cent';
                return $pre . ($r ? ' ' . $toWords($r) : ($c > 1 ? 's' : ''));
            }
            if ($n < 1000000) {
                $m = intdiv($n, 1000); $r = $n % 1000;
                $pre = $m === 1 ? 'mille' : $toWords($m) . ' mille';
                return $pre . ($r ? ' ' . $toWords($r) : '');
            }
            $m = intdiv($n, 1000000); $r = $n % 1000000;
            return $toWords($m) . ' million' . ($m > 1 ? 's' : '') . ($r ? ' ' . $toWords($r) : '');
        };

        $result = $toWords($n);
        return ucfirst($result) . ' franc' . ($n > 1 ? 's' : '') . ' CFA';
    }

    /** Generate QR code PNG as base64 using GD (no Imagick needed) */
    private function generateQrPngBase64(string $text, int $size = 120): string
    {
        try {
            $qrCode = \BaconQrCode\Encoder\Encoder::encode(
                $text,
                \BaconQrCode\Common\ErrorCorrectionLevel::M()
            );
            $matrix = $qrCode->getMatrix();
            $w      = $matrix->getWidth();
            $scale  = max(1, intval($size / $w));
            $dim    = $w * $scale;

            $img   = imagecreate($dim, $dim);
            $white = imagecolorallocate($img, 255, 255, 255);
            $black = imagecolorallocate($img, 0,   0,   0);
            imagefill($img, 0, 0, $white);

            for ($y = 0; $y < $w; $y++) {
                for ($x = 0; $x < $w; $x++) {
                    if ($matrix->get($x, $y) === 1) {
                        imagefilledrectangle($img,
                            $x * $scale, $y * $scale,
                            ($x + 1) * $scale - 1, ($y + 1) * $scale - 1,
                            $black
                        );
                    }
                }
            }

            ob_start();
            imagepng($img);
            $png = ob_get_clean();
            imagedestroy($img);
            return base64_encode($png);
        } catch (\Throwable) {
            return '';
        }
    }

    private function generateQrBase64(Student $student): string
    {
        $url = url('/qr/verify?matricule=' . urlencode($student->matricule ?? (string)$student->id));
        return $this->generateQrPngBase64($url);
    }

    /** Generate class list PDF */
    /** @param string $type 'presence' (Absent/Présent) ou 'notes' (Dev1/Dev2/M.Dev/Exam) */
    public function generateClassList($students, $filiere, $license = null, string $type = 'presence'): string
    {
        $annee = date('Y') . '-' . (date('Y') + 1);
        $view  = $type === 'notes' ? 'pdf.class_list_notes' : 'pdf.class_list_presence';
        $pdf   = Pdf::loadView($view, compact('students', 'filiere', 'license', 'annee'))
            ->setPaper('a4', 'portrait');

        $filename = 'liste_' . $type . '_' . ($filiere->code ?? 'classe') . '_' . ($license?->code ?? 'all') . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'class_lists/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }

    /** Generate PDF of unpaid students for a given month */
    public function generateImpayesPdf(array $etudiants, string $mois): string
    {
        $moisLabel = $this->moisLabel($mois);
        $pdf = Pdf::loadView('pdf.impayes', compact('etudiants', 'mois', 'moisLabel'))
            ->setPaper('a4', 'portrait');

        $filename = 'impayes_' . $mois . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'impayes/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }

    /** Generate payment receipt PDF and save it. Returns storage path. */
    public function generateReceipt(Payment $payment, bool $sendEmail = false): string
    {
        $payment->load([
            'student.filiere',
            'student.license',
            'student.payments' => fn ($q) => $q->whereIn('statut', ['complete', 'partiel'])->orderBy('created_at'),
        ]);

        $student   = $payment->student;
        $license   = $student->license;
        $allPmts   = $student->payments;

        // Paiement anticipé multi-mois : tous les versements créés ensemble (même
        // groupe_id) sont fusionnés dans un seul et même reçu (un seul montant reçu,
        // la liste des mois couverts) au lieu de générer un reçu par mois.
        $groupePayments = $payment->groupe_id
            ? $allPmts->where('groupe_id', $payment->groupe_id)->values()
            : collect([$payment]);
        $montantGroupe = floatval($groupePayments->sum('montant'));

        // Frais annexes fixes (depuis site_settings)
        $siteSettings   = \Illuminate\Support\Facades\DB::table('site_settings')->pluck('valeur', 'cle');
        $fraisAmea      = floatval($siteSettings['frais_amea']      ?? 10000);
        $fraisTenue     = floatval($siteSettings['frais_tenue']     ?? 60000);
        $fraisAssurance = floatval($siteSettings['frais_assurance'] ?? 10000);

        // Financial summary
        $fraisInscription  = floatval($license->frais_inscription ?? 0);
        $fraisMensuel      = floatval($license->frais_mensuel ?? 0);
        $dureeAnnees       = intval($license->duree_annees ?? 1);
        $nbMoisAnnee       = 10; // mois effectifs par an

        // frais_inscription = TOTAL; scolarité = dérivée (total - amea - tenue - assurance - dernier mois)
        $inscriptionTotal   = $fraisInscription; // le total est la valeur du champ frais_inscription de la licence
        $fraisScolarite     = max(0, $inscriptionTotal - $fraisAmea - $fraisTenue - $fraisAssurance - $fraisMensuel);

        $inscriptionPaid   = $allPmts->where('type', 'inscription')->sum('montant');
        $mensualitesPaid   = $allPmts->where('type', 'mensualite')->sum('montant');
        $totalPaid         = floatval($allPmts->sum('montant'));
        $inscriptionRestant = max(0, $inscriptionTotal - $inscriptionPaid);

        // Dernier mois clé pour l'inscription (avec correction d'année si année scolaire déjà terminée)
        $dernierMoisCle = null;
        if ($license) {
            $moisFin    = intval($license->mois_fin    ?? 6);
            $moisDebutL = intval($license->mois_debut  ?? 9);
            $now2       = \Carbon\Carbon::now();
            $anneeD2    = ($now2->month >= $moisDebutL) ? $now2->year : $now2->year - 1;
            $anneeFinOff2 = ($moisFin < $moisDebutL) ? 1 : 0;
            $tentEnd2   = \Carbon\Carbon::create($anneeD2 + $anneeFinOff2, $moisFin, 1)->endOfMonth();
            if ($tentEnd2->lt($now2)) {
                $anneeD2++;
            }
            $dernierMoisCle = ($anneeD2 + $anneeFinOff2) . '-' . str_pad($moisFin, 2, '0', STR_PAD_LEFT);
        }

        // Months already paid
        $moisPayesKeys = $allPmts->where('type', 'mensualite')
            ->pluck('mois')->filter()->unique()->sort()->values();

        $moisPayesList = $moisPayesKeys->map(fn($k) => [
            'cle'   => $k,
            'label' => $this->moisLabel($k),
        ])->values();

        // Next unpaid months (upcoming 12 months)
        $moisAVenir = [];
        for ($i = 0; $i <= 18 && count($moisAVenir) < 6; $i++) {
            $d   = now()->addMonths($i);
            $key = $d->format('Y-m');
            if (!$moisPayesKeys->contains($key)) {
                $moisAVenir[] = ['cle' => $key, 'label' => $this->moisLabel($key), 'montant' => $fraisMensuel];
            }
        }

        // Partial month deficit: if student paid less than fraisMensuel for a month
        $deficits = $allPmts->where('type', 'mensualite')
            ->groupBy('mois')
            ->map(fn($g, $mois) => [
                'mois'      => $mois,
                'label'     => $this->moisLabel($mois),
                'paye'      => $g->sum('montant'),
                'attendu'   => $fraisMensuel,
                'manque'    => max(0, $fraisMensuel - $g->sum('montant')),
            ])
            ->filter(fn($d) => $d['manque'] > 0)
            ->values();

        // Annual totals
        $totalAnnee    = $fraisInscription + ($fraisMensuel * $nbMoisAnnee);
        $totalRestant  = max(0, $totalAnnee - $totalPaid);

        $montantLettres = $this->montantEnLettres($montantGroupe);
        $qrBase64       = $this->generateQrBase64($student);

        $avancePaiement = floatval($student->avance_paiement ?? 0);

        $data = compact(
            'payment', 'student',
            'groupePayments', 'montantGroupe',
            'fraisInscription', 'fraisScolarite', 'fraisAmea', 'fraisTenue', 'fraisAssurance',
            'inscriptionTotal', 'dernierMoisCle',
            'fraisMensuel', 'dureeAnnees', 'nbMoisAnnee',
            'inscriptionPaid', 'mensualitesPaid', 'totalPaid',
            'inscriptionRestant', 'moisPayesList', 'moisAVenir', 'deficits',
            'totalAnnee', 'totalRestant',
            'avancePaiement',
            'montantLettres', 'qrBase64'
        );

        $pdf = Pdf::loadView('pdf.receipt', $data)->setPaper('a4', 'portrait');

        $filename = 'recu_' . $payment->id . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'receipts/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        $payment->update(['recu_pdf_path' => $path]);

        if ($sendEmail && !$payment->recu_email_envoye && $student->user?->email) {
            try {
                Mail::to($student->user->email)
                    ->send(new PaymentReceipt($payment, Storage::disk('public')->path($path)));
                $payment->update(['recu_email_envoye' => true]);
            } catch (\Exception $e) {
                \Log::warning('Email reçu paiement: ' . $e->getMessage());
            }
        }

        return $path;
    }

    /** Generate inscription acceptance letter PDF */
    public function generateAcceptanceLetter(Student $student): ?string
    {
        $student->load(['filiere', 'license', 'user']);

        $pdf = Pdf::loadView('pdf.acceptance', ['student' => $student])
            ->setPaper('a4', 'portrait');

        $filename = 'acceptation_' . ($student->matricule ?? $student->id) . '.pdf';
        $path     = 'letters/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());

        return Storage::disk('public')->path($path);
    }

    /** Generate student card PDF */
    public function generateStudentCard(Student $student): string
    {
        $student->load(['filiere', 'license', 'card']);

        // QR code as base64 PNG using GD (Imagick not required)
        $qrUrl    = url('/qr/verify?matricule=' . urlencode($student->matricule ?? ''));
        $qrBase64 = $this->generateQrPngBase64($qrUrl, 110);

        // Photo as base64 if exists
        $photoBase64 = null;
        if ($student->photo) {
            $photoPath = Storage::disk('public')->path($student->photo);
            if (file_exists($photoPath)) {
                $mime        = mime_content_type($photoPath) ?: 'image/jpeg';
                $photoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($photoPath));
            }
        }

        $anneeCourte  = substr($student->annee_scolaire ?? date('Y'), -2);
        $licCode      = $student->license?->code ?? $student->filiere?->code ?? 'ISI';
        $refCarte     = ($student->matricule ?? 'ISI-' . date('Y') . '-' . str_pad((string) $student->id, 4, '0', STR_PAD_LEFT)) . '/ISI SUPTECH';
        $codeBas      = $licCode . '-' . $anneeCourte . '-' . str_pad((string) $student->id, 4, '0', STR_PAD_LEFT);

        // Largeurs en pt, mises à l'échelle pour tenir exactement dans la zone
        // réservée au code-barres (155pt) — le nombre de modules dépend de la
        // longueur du texte encodé, donc l'échelle doit être calculée ici et non
        // codée en dur dans la vue (sinon le code-barres déborde de la carte).
        $barcodeModules = $this->code128Widths($refCarte);
        $totalModules   = array_sum($barcodeModules) ?: 1;
        $moduleWidthPt  = 155 / $totalModules;
        $barcodeSegments = [];
        foreach ($barcodeModules as $i => $w) {
            $barcodeSegments[] = ['pt' => round($w * $moduleWidthPt, 2), 'black' => $i % 2 === 0];
        }

        $pdf = Pdf::loadView('pdf.student_card', [
            'student'         => $student,
            'qrBase64'        => $qrBase64,
            'photoBase64'     => $photoBase64,
            'refCarte'        => $refCarte,
            'codeBas'         => $codeBas,
            'barcodeSegments' => $barcodeSegments,
        ])->setPaper([0, 0, 245, 155], 'portrait');

        $filename = 'carte_' . $student->matricule . '.pdf';
        $path     = 'cards/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    /**
     * Encode un texte en Code 128 (jeu B) et retourne la liste des largeurs de
     * modules (barre/espace alternés, en commençant par une barre noire), y
     * compris le symbole START B, le checksum et le motif STOP. Rendu ensuite
     * en HTML/CSS (divs alternés) dans la vue de la carte étudiant — pas besoin
     * de lib externe / extension GD dédiée au code-barres.
     */
    private function code128Widths(string $text): array
    {
        // Motifs (largeurs de module, 6 chiffres) pour les valeurs 0 à 102 du jeu B.
        $patterns = [
            '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
            '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
            '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
            '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
            '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
            '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
            '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
            '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
            '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
            '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
            '114131','311141','411131',
        ];
        $startB = '211214'; // valeur 104 (START Code B)
        $stop   = '2331112';

        $codes = [104];
        foreach (str_split($text) as $ch) {
            $ascii     = ord($ch);
            $codes[] = ($ascii >= 32 && $ascii <= 126) ? $ascii - 32 : 0; // hors plage → espace
        }
        $checksum = $codes[0];
        foreach (array_slice($codes, 1) as $i => $v) {
            $checksum += $v * ($i + 1);
        }
        $codes[] = $checksum % 103;

        $widths = [];
        foreach ($codes as $c) {
            $pattern = $c === 104 ? $startB : $patterns[$c];
            foreach (str_split($pattern) as $w) {
                $widths[] = (int) $w;
            }
        }
        foreach (str_split($stop) as $w) {
            $widths[] = (int) $w;
        }

        return $widths;
    }

    /** Generate "attestation de scolarité" PDF. Returns storage path. */
    public function generateAttestationScolarite(Student $student): string
    {
        $student->load(['filiere', 'license']);
        $pdf = Pdf::loadView('pdf.attestation_scolarite', compact('student'))->setPaper('a4', 'portrait');

        $filename = 'attestation_scolarite_' . ($student->matricule ?? $student->id) . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'attestations/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }

    /** Generate "attestation d'inscription" PDF. Returns storage path. */
    public function generateAttestationInscription(Student $student): string
    {
        $student->load(['filiere', 'license']);
        $pdf = Pdf::loadView('pdf.attestation_inscription', compact('student'))->setPaper('a4', 'portrait');

        $filename = 'attestation_inscription_' . ($student->matricule ?? $student->id) . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'attestations/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }

    /** Generate "fiche d'inscription" (registration contract) PDF. Returns storage path. */
    public function generateFicheInscription(Student $student): string
    {
        $student->load(['filiere', 'license', 'user']);

        $siteSettings = \Illuminate\Support\Facades\DB::table('site_settings')->pluck('valeur', 'cle');

        $photoBase64 = null;
        if ($student->photo) {
            $photoPath = Storage::disk('public')->path($student->photo);
            if (file_exists($photoPath)) {
                $mime        = mime_content_type($photoPath) ?: 'image/jpeg';
                $photoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($photoPath));
            }
        }

        $pdf = Pdf::loadView('pdf.fiche_inscription', compact('student', 'siteSettings', 'photoBase64'))
            ->setPaper('a4', 'portrait');

        $filename = 'fiche_inscription_' . ($student->matricule ?? $student->id) . '_' . now()->format('YmdHis') . '.pdf';
        $path     = 'fiches/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }

    /** Generate the daily cash collection report ("brouillard d'encaissement du jour"). Returns storage path. */
    public function generateBrouillardEncaissement(\Carbon\Carbon $date, ?string $faitPar = null): string
    {
        $modeLabels = ['especes' => 'Espèce', 'cheque' => 'Chèque', 'virement' => 'Virement', 'wave' => 'Wave'];

        $payments = Payment::whereDate('date_paiement', $date)
            ->where('statut', 'complete')
            ->with(['student', 'saiseur'])
            ->orderBy('date_paiement')
            ->get();

        $groupes = [];
        foreach ($payments as $p) {
            $mode = $modeLabels[$p->methode] ?? ucfirst($p->methode ?? '—');
            $groupes[$mode] ??= [];
            $anneeCourte    = $date->format('y');
            $licCode        = $p->student?->license?->code ?? 'ISI';
            $groupes[$mode][] = [
                'num_piece'   => strtoupper(substr(md5($p->id . $p->created_at), 0, 10)),
                'identifiant' => '411-' . $anneeCourte . '-' . str_pad($p->student_id, 4, '0', STR_PAD_LEFT) . '/ISI',
                'numero_recu' => str_pad($p->id, 5, '0', STR_PAD_LEFT),
                'matricule'   => $p->student?->matricule ?? '—',
                'nom_complet' => trim(($p->student?->prenom ?? '') . ' ' . ($p->student?->nom ?? '')),
                'heure'       => $p->date_paiement?->format('H:i') ?? '—',
                // "Le mois" = mois de la transaction (date d'encaissement), pas le mois de mensualité visé.
                'mois'        => $p->date_paiement ? $this->moisLabel($p->date_paiement->format('Y-m')) : '—',
                'montant'     => floatval($p->montant),
            ];
        }

        $totalGeneral = $payments->sum('montant');
        $faitPar      = $faitPar ?? ($payments->first()?->saiseur?->name ?? 'ISI SUPTECH');

        $pdf = Pdf::loadView('pdf.brouillard_encaissement', compact('date', 'groupes', 'totalGeneral', 'faitPar'))
            ->setPaper('a4', 'portrait');

        $filename = 'brouillard_' . $date->format('Ymd') . '_' . now()->format('His') . '.pdf';
        $path     = 'brouillards/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());
        return $path;
    }
}
