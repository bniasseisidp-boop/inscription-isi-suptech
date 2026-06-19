<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReceipt;
use App\Mail\InscriptionAccepted;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PDFService
{
    /**
     * Generate payment receipt PDF
     */
    public function generateReceipt(Payment $payment): string
    {
        $payment->load(['student.filiere', 'student.license', 'student.user']);

        // generate QR for receipt indicating student's payment status
        $qrData = json_encode([
            'matricule' => $payment->student->matricule,
            'payment_id' => $payment->id,
            'statut_paiement' => $payment->student->inscription_payee ? 'a_jour' : 'non_a_jour',
        ]);
        $qrImageSvg = QrCode::format('svg')->size(200)->errorCorrection('H')->generate($qrData);
        $qrPath = 'qrcodes/receipt_' . $payment->id . '.svg';
        Storage::put('public/' . $qrPath, $qrImageSvg);

        $pdf = Pdf::loadView('pdf.receipt', ['payment' => $payment, 'qr_path' => $qrPath])
            ->setPaper('a4', 'portrait');

        $filename = 'recu_' . $payment->id . '_' . now()->format('YmdHis') . '.pdf';
        $path = 'receipts/' . $filename;

        Storage::put('public/' . $path, $pdf->output());

        $payment->update(['recu_pdf_path' => $path]);

        if (!$payment->recu_email_envoye) {
            Mail::to($payment->student->user->email)
                ->send(new PaymentReceipt($payment, Storage::path('public/' . $path)));
            $payment->update(['recu_email_envoye' => true]);
        }

        return $path;
    }

    /**
     * Generate inscription acceptance letter PDF
     */
    public function generateAcceptanceLetter(Student $student): string
    {
        $student->load(['filiere', 'license', 'user']);

        $pdf = Pdf::loadView('pdf.acceptance', ['student' => $student])
            ->setPaper('a4', 'portrait');

        $filename = 'acceptation_' . $student->matricule . '.pdf';
        $path = 'letters/' . $filename;

        Storage::put('public/' . $path, $pdf->output());

        Mail::to($student->user->email)
            ->send(new InscriptionAccepted($student, Storage::path('public/' . $path)));

        return $path;
    }

    /**
     * Generate student card PDF
     */
    public function generateStudentCard(Student $student): string
    {
        $student->load(['filiere', 'license', 'card']);

        $pdf = Pdf::loadView('pdf.student_card', ['student' => $student])
            ->setPaper([0, 0, 245, 155], 'portrait');

        $filename = 'carte_' . $student->matricule . '.pdf';
        $path = 'cards/' . $filename;

        Storage::put('public/' . $path, $pdf->output());

        // Save PDF path on student card if exists, else on student
        try {
            if ($student->card) {
                $student->card->update(['qr_pdf_path' => $path]);
            } else {
                $student->update(['qr_code_path' => $student->qr_code_path ?? null]);
            }
        } catch (\Exception $e) {
            \Log::warning('Unable to save card PDF path: ' . $e->getMessage());
        }

        return $path;
    }
}
