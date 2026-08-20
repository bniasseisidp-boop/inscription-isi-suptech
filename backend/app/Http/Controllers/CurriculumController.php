<?php

namespace App\Http\Controllers;

use App\Models\EmploiDuTemps;
use App\Models\License;
use App\Models\Matiere;
use App\Models\Module;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Semestre;
use App\Models\Student;
use App\Services\BulletinService;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    /** Arbre complet Semestres -> Modules -> Matières pour un niveau (license) donné.
     *  Pour les filieres "calcul_simple" (BT, BTS...), les matieres sont attachees
     *  directement au semestre (matieres_directes), sans UE/module. */
    public function semestres(License $license)
    {
        return response()->json(
            $license->semestres()
                ->with('modules.matieres.professeur', 'modules.matieres.creneaux', 'matieresDirectes.professeur', 'matieresDirectes.creneaux')
                ->get()
        );
    }

    public function createSemestre(Request $request, License $license)
    {
        $validated = $request->validate([
            'annee'          => 'required|integer|min:1|max:8',
            'numero'         => 'required|integer|in:1,2',
            'credits_requis' => 'nullable|integer|min:1',
        ]);
        $numeroGlobal = ($validated['annee'] - 1) * 2 + $validated['numero'];

        $semestre = Semestre::updateOrCreate(
            ['license_id' => $license->id, 'numero_global' => $numeroGlobal],
            [
                'annee' => $validated['annee'], 'numero' => $validated['numero'],
                'libelle' => "Semestre {$numeroGlobal}",
                'credits_requis' => $validated['credits_requis'] ?? 30,
            ]
        );

        return response()->json($semestre, 201);
    }

    // ── Modules (UE) ─────────────────────────────────────────────────────────

    public function createModule(Request $request, Semestre $semestre)
    {
        $validated = $request->validate([
            'code'    => 'required|string|max:30',
            'nom'     => 'required|string|max:150',
            'credits' => 'required|numeric|min:0',
        ]);
        $ordre = $semestre->modules()->max('ordre') + 1;
        $module = $semestre->modules()->create($validated + ['ordre' => $ordre]);
        return response()->json($module, 201);
    }

    public function updateModule(Request $request, Module $module)
    {
        $validated = $request->validate([
            'code'    => 'sometimes|string|max:30',
            'nom'     => 'sometimes|string|max:150',
            'credits' => 'sometimes|numeric|min:0',
        ]);
        $module->update($validated);
        return response()->json($module);
    }

    public function deleteModule(Module $module)
    {
        $module->delete();
        return response()->json(['message' => 'Module supprimé.']);
    }

    // ── Matières (EC) ────────────────────────────────────────────────────────

    public function createMatiere(Request $request, Module $module)
    {
        $validated = $request->validate([
            'code'          => 'required|string|max:30',
            'nom'           => 'required|string|max:200',
            'cm'            => 'nullable|integer|min:0',
            'tp'            => 'nullable|integer|min:0',
            'td'            => 'nullable|integer|min:0',
            'tpe'           => 'nullable|integer|min:0',
            'vht'           => 'nullable|integer|min:0',
            'coef'          => 'required|numeric|min:0',
            'credits'       => 'nullable|numeric|min:0',
            'professeur_id' => 'nullable|exists:professeurs,id',
        ]);
        $ordre = $module->matieres()->max('ordre') + 1;
        $matiere = $module->matieres()->create($validated + ['ordre' => $ordre]);
        return response()->json($matiere->load('professeur'), 201);
    }

    /** Matiere attachee directement a un semestre, sans UE — filieres "calcul_simple". */
    public function createMatiereDirecte(Request $request, Semestre $semestre)
    {
        $validated = $request->validate([
            'code'          => 'required|string|max:30',
            'nom'           => 'required|string|max:200',
            'cm'            => 'nullable|integer|min:0',
            'tp'            => 'nullable|integer|min:0',
            'td'            => 'nullable|integer|min:0',
            'tpe'           => 'nullable|integer|min:0',
            'vht'           => 'nullable|integer|min:0',
            'coef'          => 'required|numeric|min:0',
            'professeur_id' => 'nullable|exists:professeurs,id',
        ]);
        $ordre = $semestre->matieresDirectes()->max('ordre') + 1;
        $matiere = $semestre->matieresDirectes()->create($validated + ['ordre' => $ordre]);
        return response()->json($matiere->load('professeur'), 201);
    }

    public function updateMatiere(Request $request, Matiere $matiere)
    {
        $validated = $request->validate([
            'code'          => 'sometimes|string|max:30',
            'nom'           => 'sometimes|string|max:200',
            'cm'            => 'sometimes|integer|min:0',
            'tp'            => 'sometimes|integer|min:0',
            'td'            => 'sometimes|integer|min:0',
            'tpe'           => 'sometimes|integer|min:0',
            'vht'           => 'sometimes|integer|min:0',
            'coef'          => 'sometimes|numeric|min:0',
            'credits'       => 'nullable|numeric|min:0',
            'professeur_id' => 'nullable|exists:professeurs,id',
        ]);
        $matiere->update($validated);
        return response()->json($matiere->load('professeur'));
    }

    public function deleteMatiere(Matiere $matiere)
    {
        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée.']);
    }

    // ── Professeurs ──────────────────────────────────────────────────────────

    public function professeurs()
    {
        return response()->json(Professeur::orderBy('nom')->get());
    }

    public function createProfesseur(Request $request)
    {
        $validated = $request->validate([
            'nom'        => 'required|string|max:100',
            'prenom'     => 'required|string|max:100',
            'email'      => 'nullable|email|max:150',
            'telephone'  => 'nullable|string|max:30',
            'specialite' => 'nullable|string|max:150',
        ]);
        return response()->json(Professeur::create($validated), 201);
    }

    public function updateProfesseur(Request $request, Professeur $professeur)
    {
        $validated = $request->validate([
            'nom'        => 'sometimes|string|max:100',
            'prenom'     => 'sometimes|string|max:100',
            'email'      => 'nullable|email|max:150',
            'telephone'  => 'nullable|string|max:30',
            'specialite' => 'nullable|string|max:150',
            'actif'      => 'sometimes|boolean',
        ]);
        $professeur->update($validated);
        return response()->json($professeur);
    }

    public function deleteProfesseur(Professeur $professeur)
    {
        $professeur->delete();
        return response()->json(['message' => 'Professeur supprimé.']);
    }

    /** Cree (ou reutilise) un compte de connexion pour ce professeur, avec un
     *  mot de passe temporaire envoye par email — meme mecanique que le staff. */
    public function createProfesseurAccount(Request $request, Professeur $professeur)
    {
        if ($professeur->user_id) {
            return response()->json(['message' => 'Ce professeur a déjà un compte.'], 422);
        }

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
        ]);

        $tempPassword = \Illuminate\Support\Str::random(10);
        $user = \App\Models\User::create([
            'name'     => trim($professeur->prenom . ' ' . $professeur->nom),
            'email'    => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($tempPassword),
            'role'     => 'professeur',
        ]);

        $professeur->update(['user_id' => $user->id, 'email' => $professeur->email ?: $validated['email']]);

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\StaffInvite($user, $tempPassword));
        } catch (\Exception $e) {
            \Log::warning('Email invitation professeur: ' . $e->getMessage());
        }

        return response()->json($professeur->fresh(), 201);
    }

    // ── Verrouillage de la saisie des notes ─────────────────────────────────

    /** Statut du verrou de saisie pour un semestre + annee scolaire donnee. */
    public function verrouStatus(\App\Models\Semestre $semestre, Request $request)
    {
        $anneeScolaire = $request->query('annee_scolaire', date('Y') . '-' . (date('Y') + 1));
        $verrou = \App\Models\VerrouNotes::where('semestre_id', $semestre->id)
            ->where('annee_scolaire', $anneeScolaire)->first();

        return response()->json(['verrouille' => (bool) ($verrou?->verrouille), 'annee_scolaire' => $anneeScolaire]);
    }

    /** Active/desactive le verrou — bloque la saisie des profs le temps de generer les bulletins. */
    public function verrouToggle(\App\Models\Semestre $semestre, Request $request)
    {
        $validated = $request->validate([
            'annee_scolaire' => 'required|string|max:20',
            'verrouille'     => 'required|boolean',
        ]);

        $verrou = \App\Models\VerrouNotes::updateOrCreate(
            ['semestre_id' => $semestre->id, 'annee_scolaire' => $validated['annee_scolaire']],
            [
                'verrouille'     => $validated['verrouille'],
                'verrouille_par' => $request->user()->id,
                'verrouille_le'  => now(),
            ]
        );

        return response()->json($verrou);
    }

    // ── Emploi du temps ──────────────────────────────────────────────────────

    public function createCreneau(Request $request, Matiere $matiere)
    {
        $validated = $request->validate([
            'jour'         => 'required|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut'  => 'required|date_format:H:i',
            'heure_fin'    => 'required|date_format:H:i|after:heure_debut',
            'salle'        => 'nullable|string|max:50',
        ]);
        $creneau = $matiere->creneaux()->create($validated);
        return response()->json($creneau, 201);
    }

    public function deleteCreneau(EmploiDuTemps $creneau)
    {
        $creneau->delete();
        return response()->json(['message' => 'Créneau supprimé.']);
    }

    // ── Présences (consultation/saisie par Admin ou Accueil Pédagogique) ────────

    /** Effectif + présences d'une matière pour une date donnée — vue admin/pédagogique
     *  (les profs voient/saisissent la même donnée depuis leur propre espace). */
    public function presences(Matiere $matiere, Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $matiere->loadMissing('module.semestre');

        $etudiants = Student::where('license_id', $matiere->semestreResolu()->license_id)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom']);

        $presences = \App\Models\Presence::where('matiere_id', $matiere->id)->where('date', $date)
            ->get()->keyBy('student_id');

        return response()->json([
            'date' => $date,
            'etudiants' => $etudiants->map(fn ($e) => [
                'id' => $e->id, 'matricule' => $e->matricule, 'nom' => $e->nom, 'prenom' => $e->prenom,
                'present' => $presences->has($e->id) ? $presences->get($e->id)->present : null,
            ]),
        ]);
    }

    /** Cahier de texte d'une matiere (grandes lignes enseignees par le prof) — vue admin/pédagogique. */
    public function contenus(Matiere $matiere)
    {
        return response()->json($matiere->contenusCours()->orderByDesc('date')->get());
    }

    /** Saisie/correction de l'appel par Admin ou Accueil Pédagogique (même règle que le prof). */
    public function saisirPresences(Matiere $matiere, Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'presences' => 'required|array|min:1',
            'presences.*.student_id' => 'required|exists:students,id',
            'presences.*.present' => 'required|boolean',
        ]);

        foreach ($validated['presences'] as $entry) {
            \App\Models\Presence::updateOrCreate(
                ['student_id' => $entry['student_id'], 'matiere_id' => $matiere->id, 'date' => $validated['date']],
                ['present' => $entry['present'], 'saisi_par' => $request->user()->id]
            );
        }

        return response()->json(['message' => 'Présences enregistrées.']);
    }

    /** Emploi du temps de l'étudiant connecté (semestre en cours déduit de son niveau). */
    public function monEmploiDuTemps(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->first();
        if (!$student || !$student->license_id) return response()->json(['creneaux' => []]);

        // Un niveau (License) = une seule annee scolaire = 2 semestres (S1+S2). On ne sait
        // pas toujours quel semestre precis est "en cours" pour l'etudiant (pas de champ
        // dedie), donc on remonte les creneaux des DEUX semestres de son niveau plutot que
        // de deviner lequel — sinon un emploi du temps saisi sur l'autre semestre restait
        // invisible pour l'etudiant (bug corrige ici).
        $semestreIds = Semestre::where('license_id', $student->license_id)->pluck('id');

        if ($semestreIds->isEmpty()) return response()->json(['creneaux' => []]);

        $creneaux = EmploiDuTemps::whereHas('matiere', fn ($q) => $q->whereHas('module', fn ($q2) => $q2->whereIn('semestre_id', $semestreIds)))
            ->with(['matiere.module.semestre', 'matiere.professeur'])
            ->orderBy('jour')->orderBy('heure_debut')
            ->get();

        return response()->json(['creneaux' => $creneaux]);
    }

    /** Liste des bulletins (calculés à la volée) de l'étudiant connecté, un par semestre de son niveau. */
    public function mesBulletins(Request $request, BulletinService $bulletinService)
    {
        $student = Student::where('user_id', $request->user()->id)->with('license')->firstOrFail();
        if (!$student->license_id) return response()->json([]);

        $anneeScolaire = $student->annee_scolaire ?? (date('Y') . '-' . (date('Y') + 1));
        $semestres = Semestre::where('license_id', $student->license_id)->orderBy('numero_global')->get();
        $calculSimple = (bool) $student->license?->calcul_simple;

        $bulletins = $semestres->map(fn ($s) => $calculSimple
            ? $bulletinService->detailSemestreSimple($student, $s, $anneeScolaire)
            : $bulletinService->detailSemestre($student, $s, $anneeScolaire));

        return response()->json(['annee_scolaire' => $anneeScolaire, 'calcul_simple' => $calculSimple, 'bulletins' => $bulletins]);
    }

    /** Téléchargement du PDF officiel d'un de ses propres bulletins par l'étudiant connecté. */
    public function telechargerMonBulletin(Request $request, Semestre $semestre, \App\Services\PDFService $pdfService)
    {
        $student = Student::where('user_id', $request->user()->id)->with('license')->firstOrFail();
        abort_if($student->license_id !== $semestre->license_id, 403, "Ce bulletin ne concerne pas votre niveau.");

        if (!$student->estEnRegle()) {
            return response()->json([
                'message' => "Votre bulletin ne peut pas être téléchargé : vous n'êtes pas à jour de vos paiements. Régularisez votre situation auprès de la caisse.",
            ], 422);
        }

        $anneeScolaire = $student->annee_scolaire ?? (date('Y') . '-' . (date('Y') + 1));
        $path = $student->license?->calcul_simple
            ? $pdfService->generateBulletinSimple($student, $semestre, $anneeScolaire, null)
            : $pdfService->generateBulletin($student, $semestre, $anneeScolaire, null);
        $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        if (!file_exists($full)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        return response()->file($full, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="bulletin_S' . $semestre->numero_global . '.pdf"',
        ]);
    }

    /** Grand tableau de délibération de la classe (JSON, pour affichage à l'écran). */
    public function conseilClasse(Semestre $semestre, Request $request, BulletinService $bulletinService)
    {
        $anneeScolaire = $request->query('annee_scolaire', date('Y') . '-' . (date('Y') + 1));
        return response()->json($bulletinService->conseilClasse($semestre, $anneeScolaire));
    }

    /** PDF du grand tableau de délibération de la classe. */
    public function downloadConseilClasse(Semestre $semestre, Request $request, \App\Services\PDFService $pdfService)
    {
        $anneeScolaire = $request->query('annee_scolaire', date('Y') . '-' . (date('Y') + 1));
        $path = $pdfService->generateConseilClasse($semestre, $anneeScolaire);
        $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        return response()->file($full, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="conseil_classe_S' . $semestre->numero_global . '.pdf"',
        ])->deleteFileAfterSend(true);
    }

    /** Genere en un seul coup les bulletins PDF de tous les etudiants "en regle" (a jour
     *  de paiement) de la classe, dans une archive ZIP. Les etudiants non en regle sont
     *  listes a part dans la reponse pour que l'admin sache lesquels ont ete ignores. */
    public function downloadBulletinsClasse(Semestre $semestre, Request $request, \App\Services\PDFService $pdfService)
    {
        $anneeScolaire = $request->query('annee_scolaire', date('Y') . '-' . (date('Y') + 1));

        $etudiants = Student::where('license_id', $semestre->license_id)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get();

        $enRegle = $etudiants->filter(fn ($e) => $e->estEnRegle());
        if ($enRegle->isEmpty()) {
            return response()->json(['message' => "Aucun étudiant de cette classe n'est à jour de ses paiements."], 422);
        }

        $tmpZip = tempnam(sys_get_temp_dir(), 'bulletins_') . '.zip';
        $zip = new \ZipArchive();
        $zip->open($tmpZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        foreach ($enRegle as $etudiant) {
            $path = $semestre->license?->calcul_simple
                ? $pdfService->generateBulletinSimple($etudiant, $semestre, $anneeScolaire, null)
                : $pdfService->generateBulletin($etudiant, $semestre, $anneeScolaire, null);
            $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);
            $nomFichier = 'bulletin_' . ($etudiant->matricule ?? $etudiant->id) . '_' . str_replace(' ', '_', $etudiant->nom) . '.pdf';
            $zip->addFile($full, $nomFichier);
        }
        $zip->close();

        $filename = 'bulletins_S' . $semestre->numero_global . '_' . now()->format('Ymd') . '.zip';
        return response()->download($tmpZip, $filename)->deleteFileAfterSend(true);
    }

    /** PDF de l'emploi du temps complet d'une classe (filière + niveau + semestre). */
    public function downloadEmploiDuTemps(Semestre $semestre, \App\Services\PDFService $pdfService)
    {
        $path = $pdfService->generateEmploiDuTempsClasse($semestre);
        $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        return response()->file($full, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="emploi_du_temps_S' . $semestre->numero_global . '.pdf"',
        ])->deleteFileAfterSend(true);
    }

    // ── Notes ────────────────────────────────────────────────────────────────

    /** Saisie/mise à jour en masse des notes d'un étudiant pour un semestre donné. */
    public function saisirNotes(Request $request, Student $student)
    {
        $validated = $request->validate([
            'annee_scolaire' => 'required|string|max:20',
            'notes'          => 'required|array|min:1',
            'notes.*.matiere_id' => 'required|exists:matieres,id',
            'notes.*.mcc'         => 'nullable|numeric|min:0|max:20',
            'notes.*.examen'      => 'nullable|numeric|min:0|max:20',
        ]);

        foreach ($validated['notes'] as $entry) {
            Note::updateOrCreate(
                ['student_id' => $student->id, 'matiere_id' => $entry['matiere_id'], 'annee_scolaire' => $validated['annee_scolaire']],
                array_filter([
                    'mcc'       => $entry['mcc'] ?? null,
                    'examen'    => $entry['examen'] ?? null,
                    'saisi_par' => $request->user()->id,
                ], fn ($v) => $v !== null)
            );
        }

        return response()->json(['message' => 'Notes enregistrées.']);
    }

    /** Bulletin calculé (moyennes, validation, mention) pour un étudiant + semestre. */
    public function bulletin(Semestre $semestre, Student $student, Request $request, BulletinService $bulletinService)
    {
        $anneeScolaire = $request->query('annee_scolaire', $student->annee_scolaire ?? date('Y') . '-' . (date('Y') + 1));
        $calculSimple = (bool) $semestre->license?->calcul_simple;

        $detail = $calculSimple
            ? $bulletinService->detailSemestreSimple($student, $semestre, $anneeScolaire)
            : $bulletinService->detailSemestre($student, $semestre, $anneeScolaire);

        return response()->json(array_merge($detail, ['calcul_simple' => $calculSimple]));
    }

    /** PDF du bulletin officiel (format ISI SUPTECH), généré par Admin ou Accueil Pédagogique. */
    public function downloadBulletin(Semestre $semestre, Student $student, Request $request, \App\Services\PDFService $pdfService)
    {
        if (!$student->estEnRegle()) {
            return response()->json([
                'message' => "Impossible de générer le bulletin : {$student->prenom} {$student->nom} n'est pas à jour de ses paiements.",
            ], 422);
        }

        $validated = $request->validate([
            'annee_scolaire'    => 'nullable|string|max:20',
            'appreciation'      => 'nullable|string|max:150',
        ]);
        $anneeScolaire = $validated['annee_scolaire'] ?? ($student->annee_scolaire ?? date('Y') . '-' . (date('Y') + 1));

        $path = $semestre->license?->calcul_simple
            ? $pdfService->generateBulletinSimple($student, $semestre, $anneeScolaire, $validated['appreciation'] ?? null)
            : $pdfService->generateBulletin($student, $semestre, $anneeScolaire, $validated['appreciation'] ?? null);
        $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);

        if (!file_exists($full)) {
            return response()->json(['message' => 'Erreur génération PDF'], 500);
        }

        return response()->file($full, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="bulletin_' . ($student->matricule ?? $student->id) . '_S' . $semestre->numero_global . '.pdf"',
        ]);
    }
}
