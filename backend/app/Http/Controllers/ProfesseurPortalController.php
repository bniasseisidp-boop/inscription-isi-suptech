<?php

namespace App\Http\Controllers;

use App\Models\ContenuCours;
use App\Models\EmploiDuTemps;
use App\Models\Matiere;
use App\Models\Note;
use App\Models\Presence;
use App\Models\Professeur;
use App\Models\Student;
use App\Models\VerrouNotes;
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Espace professeur : emploi du temps personnel, classes enseignees, appel
 *  (presences) et saisie des notes — strictement limite aux matieres que le
 *  professeur connecte enseigne reellement. */
class ProfesseurPortalController extends Controller
{
    private function moi(Request $request): Professeur
    {
        $professeur = Professeur::where('user_id', $request->user()->id)->first();
        abort_if(!$professeur, 403, "Aucune fiche professeur n'est associée à ce compte.");
        return $professeur;
    }

    /** Verifie que la matiere appartient bien au professeur connecte. */
    private function assertProprietaire(Request $request, Matiere $matiere): Professeur
    {
        $professeur = $this->moi($request);
        abort_if($matiere->professeur_id !== $professeur->id, 403, "Cette matière ne vous est pas assignée.");
        return $professeur;
    }

    /** Emploi du temps complet du professeur connecte, tous jours confondus. */
    public function monEmploiDuTemps(Request $request)
    {
        $professeur = $this->moi($request);
        $creneaux = EmploiDuTemps::whereHas('matiere', fn ($q) => $q->where('professeur_id', $professeur->id))
            ->with(['matiere.module.semestre.license.filiere', 'matiere.semestre.license.filiere'])
            ->orderBy('jour')->orderBy('heure_debut')
            ->get();

        return response()->json($creneaux);
    }

    /** Liste des matieres/classes enseignees par le professeur connecte. */
    public function mesMatieres(Request $request)
    {
        $professeur = $this->moi($request);
        $matieres = Matiere::where('professeur_id', $professeur->id)
            ->with(['module.semestre.license.filiere', 'semestre.license.filiere'])
            ->orderBy('nom')
            ->get();

        return response()->json($matieres);
    }

    /** Effectif de la classe concernee par une matiere (etudiants du niveau/filiere du semestre). */
    public function roster(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $matiere->loadMissing('module.semestre');
        $licenseId = $matiere->semestreResolu()->license_id;

        $etudiants = Student::where('license_id', $licenseId)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom', 'photo']);

        return response()->json($etudiants);
    }

    /** Appel du jour pour une matiere : effectif + presences deja enregistrees. */
    public function presences(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $date = $request->query('date', now()->toDateString());

        $matiere->loadMissing('module.semestre');
        $etudiants = Student::where('license_id', $matiere->semestreResolu()->license_id)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom']);

        $presences = Presence::where('matiere_id', $matiere->id)->where('date', $date)
            ->get()->keyBy('student_id');

        return response()->json([
            'date' => $date,
            'etudiants' => $etudiants->map(fn ($e) => [
                'id' => $e->id, 'matricule' => $e->matricule, 'nom' => $e->nom, 'prenom' => $e->prenom,
                'present' => $presences->has($e->id) ? $presences->get($e->id)->present : null,
            ]),
        ]);
    }

    /** Enregistrement en masse de l'appel pour une matiere + date donnee. */
    public function saisirPresences(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $validated = $request->validate([
            'date' => 'required|date',
            'presences' => 'required|array|min:1',
            'presences.*.student_id' => 'required|exists:students,id',
            'presences.*.present' => 'required|boolean',
        ]);

        foreach ($validated['presences'] as $entry) {
            Presence::updateOrCreate(
                ['student_id' => $entry['student_id'], 'matiere_id' => $matiere->id, 'date' => $validated['date']],
                ['present' => $entry['present'], 'saisi_par' => $request->user()->id]
            );
        }

        return response()->json(['message' => 'Présences enregistrées.']);
    }

    /** Effectif + notes deja saisies pour une matiere, pour l'annee scolaire donnee. */
    public function notes(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $anneeScolaire = $request->query('annee_scolaire', date('Y') . '-' . (date('Y') + 1));

        $matiere->loadMissing('module.semestre');
        $etudiants = Student::where('license_id', $matiere->semestreResolu()->license_id)
            ->where('statut_inscription', 'accepte')
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom']);

        $notes = Note::where('matiere_id', $matiere->id)->where('annee_scolaire', $anneeScolaire)
            ->get()->keyBy('student_id');

        $verrou = VerrouNotes::where('semestre_id', $matiere->semestreResolu()->id)
            ->where('annee_scolaire', $anneeScolaire)->first();

        return response()->json([
            'annee_scolaire' => $anneeScolaire,
            'verrouille' => (bool) ($verrou?->verrouille),
            'etudiants' => $etudiants->map(fn ($e) => [
                'id' => $e->id, 'matricule' => $e->matricule, 'nom' => $e->nom, 'prenom' => $e->prenom,
                'devoir1' => $notes->get($e->id)?->devoir1,
                'devoir2' => $notes->get($e->id)?->devoir2,
                'examen' => $notes->get($e->id)?->examen,
            ]),
        ]);
    }

    /** Saisie/correction des notes (2 devoirs + examen) par le professeur — bloquee si
     *  l'admin/l'accueil pedagogique a verrouille la saisie pour ce semestre. */
    public function saisirNotes(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $validated = $request->validate([
            'annee_scolaire' => 'required|string|max:20',
            'notes' => 'required|array|min:1',
            'notes.*.student_id' => 'required|exists:students,id',
            'notes.*.devoir1' => 'nullable|numeric|min:0|max:20',
            'notes.*.devoir2' => 'nullable|numeric|min:0|max:20',
            'notes.*.examen' => 'nullable|numeric|min:0|max:20',
        ]);

        $matiere->loadMissing('module');
        $verrou = VerrouNotes::where('semestre_id', $matiere->semestreResolu()->id)
            ->where('annee_scolaire', $validated['annee_scolaire'])->first();
        if ($verrou?->verrouille) {
            throw ValidationException::withMessages([
                'notes' => ["La saisie des notes est verrouillée pour ce semestre — la génération des bulletins est en cours. Contactez l'administration."],
            ])->status(423);
        }

        foreach ($validated['notes'] as $entry) {
            Note::updateOrCreate(
                ['student_id' => $entry['student_id'], 'matiere_id' => $matiere->id, 'annee_scolaire' => $validated['annee_scolaire']],
                array_filter([
                    'devoir1' => $entry['devoir1'] ?? null,
                    'devoir2' => $entry['devoir2'] ?? null,
                    'examen' => $entry['examen'] ?? null,
                    'saisi_par' => $request->user()->id,
                ], fn ($v) => $v !== null)
            );
        }

        return response()->json(['message' => 'Notes enregistrées.']);
    }

    // ── Cahier de texte (grandes lignes enseignees) ─────────────────────────────

    /** Historique des seances saisies par le prof pour cette matiere. */
    public function contenus(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        return response()->json($matiere->contenusCours()->orderByDesc('date')->get());
    }

    /** Ajoute/corrige les grandes lignes enseignees a une date donnee. */
    public function saisirContenu(Request $request, Matiere $matiere)
    {
        $this->assertProprietaire($request, $matiere);
        $validated = $request->validate([
            'date' => 'required|date',
            'contenu' => 'required|string|max:2000',
        ]);

        $contenu = ContenuCours::updateOrCreate(
            ['matiere_id' => $matiere->id, 'date' => $validated['date']],
            ['contenu' => $validated['contenu'], 'saisi_par' => $request->user()->id]
        );

        return response()->json($contenu, 201);
    }
}
