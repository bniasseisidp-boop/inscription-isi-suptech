<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentCard;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    /**
     * Generate student card with QR code
     */
    public function generateStudentCard(Student $student): StudentCard
    {
        $student->cards()->update(['actif' => false]);

        $numeroCarte = 'ISI-' . date('Y') . '-' . str_pad($student->id, 6, '0', STR_PAD_LEFT);

        $qrData = json_encode([
            'matricule'   => $student->matricule,
            'nom'         => $student->full_name,
            'filiere'     => $student->filiere?->code,
            'license'     => $student->license?->code,
            'annee'       => $student->annee_scolaire,
            'numero'      => $numeroCarte,
            'verification'=> base64_encode($student->matricule . ':' . config('app.key')),
            'statut_paiement' => $student->inscription_payee ? 'a_jour' : 'non_a_jour',
        ]);

        $qrImageSvg = QrCode::format('svg')
            ->size(200)
            ->errorCorrection('H')
            ->generate($qrData);

        $qrPath = 'qrcodes/qr_' . $student->matricule . '.svg';
        Storage::put('public/' . $qrPath, $qrImageSvg);

        $card = StudentCard::create([
            'student_id'      => $student->id,
            'numero_carte'    => $numeroCarte,
            'qr_code_data'    => $qrData,
            'qr_code_image'   => $qrPath,
            'annee_validite'  => date('Y') . '-' . (date('Y') + 1),
            'actif'           => true,
            'date_generation' => now(),
        ]);

            $student->update(['qr_code_path' => $qrPath]);

            // Generate PDF card and save path
            try {
                $pdfPath = app(\App\Services\PDFService::class)->generateStudentCard($student);
                if ($card) {
                    $card->update(['qr_pdf_path' => $pdfPath]);
                }
            } catch (\Exception $e) {
                \Log::warning('PDF generation failed: ' . $e->getMessage());
            }

        return $card;
    }

    /**
     * Verify QR code and return student status
     */
    public function verifyQRCode(string $qrData): array
    {
        $data = json_decode($qrData, true);

        if (!$data || !isset($data['matricule'])) {
            return ['valide' => false, 'message' => 'QR Code invalide'];
        }

        $student = Student::where('matricule', $data['matricule'])
            ->with(['filiere', 'license', 'payments'])
            ->first();

        if (!$student) {
            return ['valide' => false, 'message' => 'Étudiant introuvable'];
        }

        $moisNonPaies = $student->mois_non_payes;
        $dernierMoisNonPaye = !empty($moisNonPaies);

        return [
            'valide'            => true,
            'etudiant'          => [
                'nom'          => $student->full_name,
                'matricule'    => $student->matricule,
                'filiere'      => $student->filiere?->nom,
                'license'      => $student->license?->nom,
                'annee'        => $student->annee_scolaire,
                'photo'        => $student->photo ? asset('storage/' . $student->photo) : null,
                'statut_paiement' => $dernierMoisNonPaye ? 'non_a_jour' : 'a_jour',
                'mois_non_payes'  => $moisNonPaies,
            ],
        ];
    }
}
