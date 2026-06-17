<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReceipt;
use App\Mail\InscriptionAccepted;

class PDFService
{
    /**
     * Generate payment receipt PDF
     */
    public function generateReceipt(Payment $payment): string
    {
        $payment->load(['student.filiere', 'student.license', 'student.user']);

        $pdf = Pdf::loadView('pdf.receipt', ['payment' => $payment])
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

        return $path;
    }
}
