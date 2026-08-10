<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Services\PDFService;

class StudentProfileController extends Controller
{
    /** Get full student profile */
    public function show(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)
            ->with(['filiere', 'license', 'card', 'payments' => fn($q) => $q->where('statut', 'complete')->latest()])
            ->firstOrFail();

        return response()->json([
            'student'          => $student,
            'suivi_paiements'  => $this->getSuiviPaiements($student),
        ]);
    }

    /** Update complete profile (after acceptance) */
    public function update(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        if ($student->statut_inscription !== 'accepte') {
            return response()->json(['message' => 'Profil complet uniquement disponible après acceptation.'], 403);
        }

        $validated = $request->validate([
            // Académique
            'annee_bac'            => 'nullable|string|max:10',
            'numero_pv_bac'        => 'nullable|string|max:50',
            'serie_college'        => 'nullable|string|max:50',
            'region_bac'           => 'nullable|string|max:100',
            'dernier_diplome'      => 'nullable|string|max:100',
            'annee_dernier_diplome'=> 'nullable|string|max:10',
            'dernier_etablissement'=> 'nullable|string|max:200',
            'numero_ine'           => 'nullable|string|max:50',
            'choix_specialites'    => 'nullable|string',
            'decouverte'           => 'nullable|string|max:200',

            // Personnelles
            'civilite'             => 'nullable|in:M.,Mme,Mlle',
            'numero_cni'           => 'nullable|string|max:50',
            'date_delivrance_cni'  => 'nullable|date',
            'notes_personnelles'   => 'nullable|string',

            // Tuteur
            'tuteur_nom'           => 'nullable|string|max:100',
            'tuteur_profession'    => 'nullable|string|max:100',
            'tuteur_telephone'     => 'nullable|string|max:20',
            'tuteur_email'         => 'nullable|email',
            'tuteur_identite'      => 'nullable|string|max:50',
            'tuteur2_nom'          => 'nullable|string|max:100',
            'tuteur2_profession'   => 'nullable|string|max:100',
            'tuteur2_telephone'    => 'nullable|string|max:20',
            'tuteur2_email'        => 'nullable|email',
            'surveillance_mail'    => 'boolean',
            'surveillance_telephone' => 'boolean',

            'photo'                => 'nullable|image|max:2048',

            // Autres
            'cursus_deux_ans'      => 'nullable|string',
            'langues'              => 'nullable|string',
            'logiciels'            => 'nullable|string',
            'experiences'          => 'nullable|string',
            'traitement_medical'   => 'nullable|string|max:10',
            'allergies'            => 'nullable|string|max:10',
            'vaccinations'         => 'nullable|string|max:10',
            'contact_urgence1'     => 'nullable|string|max:100',
            'tel_urgence1'         => 'nullable|string|max:20',
            'contact_urgence2'     => 'nullable|string|max:100',
            'tel_urgence2'         => 'nullable|string|max:20',
            'medecin_famille'      => 'nullable|string|max:100',
            'tel_medecin'          => 'nullable|string|max:20',
        ]);

        // handle photo upload
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('photos', 'public');
            $validated['photo'] = $photoPath;
        }

        $student->update(array_merge($validated, ['profil_complet' => true]));

        // If student has a matricule but no StudentCard yet, generate it (creates QR + PDF).
        // If a card exists, regenerate the PDF so the new photo is embedded.
        try {
            if ($student->matricule && !$student->card) {
                app(\App\Services\QRCodeService::class)->generateStudentCard($student->fresh());
            } elseif ($student->card) {
                app(PDFService::class)->generateStudentCard($student->fresh());
            }
        } catch (\Exception $e) {
            \Log::warning('Unable to regenerate student card after photo upload: ' . $e->getMessage());
        }

        // return the student with relations so frontend shows updated card/photo immediately
        $student = $student->fresh(['filiere', 'license', 'card', 'user']);

        return response()->json([
            'message' => 'Profil mis à jour avec succès !',
            'student' => $student->fresh(),
        ]);
    }

    /** Update just the profile photo (bouton "Changer photo" de l'espace étudiant) */
    public function updatePhoto(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $request->validate([
            'photo' => 'required|image|max:2048',
        ]);

        if ($student->photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($student->photo)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($student->photo);
        }

        $photoPath = $request->file('photo')->store('photos', 'public');
        $student->update(['photo' => $photoPath]);

        // Répercute la nouvelle photo sur la carte étudiant déjà générée, s'il y en a une.
        if ($student->card) {
            try {
                app(PDFService::class)->generateStudentCard($student->fresh());
            } catch (\Exception $e) {
                \Log::warning('Régénération carte après changement de photo: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Photo mise à jour !',
            'student' => $student->fresh(['filiere', 'license', 'card', 'user']),
        ]);
    }

    /** Get payment tracking (month by month) */
    public function suiviPaiements(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)
            ->with(['license', 'payments' => fn($q) => $q->where('statut', 'complete')])
            ->firstOrFail();

        return response()->json($this->getSuiviPaiements($student));
    }

    private function getSuiviPaiements(Student $student): array
    {
        if ($student->statut_inscription !== 'accepte' || !$student->inscription_payee) {
            return [];
        }

        $debutPaiement = $student->date_debut_paiement
            ? Carbon::parse($student->date_debut_paiement)
            : Carbon::parse($student->date_acceptation ?? now())->startOfMonth()->addMonth();

        $moisTotal = $student->nombre_mois_total
            ?? ($student->license?->duree_annees ?? 1) * 10; // 10 mois/an

        $fraisMenuel = $student->license?->frais_mensuel ?? 0;

        $paiementsMensuelsFaits = $student->payments
            ->where('type', 'mensualite')
            ->pluck('mois')
            ->toArray();

        $mois = [];
        $now = Carbon::now();

        for ($i = 0; $i < $moisTotal; $i++) {
            $date = $debutPaiement->copy()->addMonths($i);
            $cle = $date->format('Y-m');
            $estPasse = $date->lt($now);
            $estPayé = in_array($cle, $paiementsMensuelsFaits);

            $mois[] = [
                'cle'       => $cle,
                'label'     => $date->isoFormat('MMMM YYYY'),
                'montant'   => $fraisMenuel,
                'paye'      => $estPayé,
                'en_retard' => $estPasse && !$estPayé,
                'futur'     => !$estPasse,
                'actuel'    => $date->isSameMonth($now),
            ];
        }

        $totalPaye   = count(array_filter($mois, fn($m) => $m['paye'])) * $fraisMenuel;
        $totalRestant = count(array_filter($mois, fn($m) => !$m['paye'])) * $fraisMenuel;
        $moisRestants = count(array_filter($mois, fn($m) => !$m['paye']));
        $moisEnRetard = count(array_filter($mois, fn($m) => $m['en_retard']));

        return [
            'mois'           => $mois,
            'frais_mensuel'  => $fraisMenuel,
            'total_paye'     => $totalPaye,
            'total_restant'  => $totalRestant,
            'mois_restants'  => $moisRestants,
            'mois_en_retard' => $moisEnRetard,
            'mois_total'     => $moisTotal,
            'mois_payes'     => $moisTotal - $moisRestants,
            'est_a_jour'     => $moisEnRetard === 0,
        ];
    }

    /**
     * Voir / télécharger le reçu d'un de ses propres paiements. Régénéré à la demande
     * (pas juste le PDF figé au moment du paiement) pour toujours refléter la logique
     * et les données actuelles — mois payés, déficit reporté, consolidation multi-mois.
     */
    public function downloadReceipt(Request $request, $id)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $payment = $student->payments()->findOrFail($id);

        $path = app(PDFService::class)->generateReceipt($payment->load('student.license.filiere'));
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        return response()->file($fullPath, ['Content-Type' => 'application/pdf']);
    }

    /** Télécharger sa propre carte étudiante */
    public function downloadCard(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)
            ->with(['filiere', 'license', 'card'])
            ->firstOrFail();

        if (!$student->card) {
            return response()->json(['message' => "Carte pas encore générée — contactez l'accueil pédagogique."], 404);
        }

        $path = app(PDFService::class)->generateStudentCard($student);
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        return response()->file($fullPath, ['Content-Type' => 'application/pdf']);
    }

    /** Annuler un paiement Wave resté bloqué en attente (pour pouvoir en relancer un). */
    public function cancelPayment(Request $request, $id)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $payment = $student->payments()->findOrFail($id);

        if (!in_array($payment->statut, ['en_attente', 'echoue'], true)) {
            return response()->json(['message' => 'Seul un paiement en attente peut être annulé.'], 422);
        }

        $payment->delete();

        return response()->json(['message' => 'Paiement annulé.']);
    }
}
