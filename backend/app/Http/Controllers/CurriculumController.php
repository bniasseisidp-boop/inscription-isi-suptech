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
    /** Arbre complet Semestres -> Modules -> Matières pour un niveau (license) donné. */
    public function semestres(License $license)
    {
        return response()->json(
            $license->semestres()->with('modules.matieres.professeur', 'modules.matieres.creneaux')->get()
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
            'professeur_id' => 'nullable|exists:professeurs,id',
        ]);
        $ordre = $module->matieres()->max('ordre') + 1;
        $matiere = $module->matieres()->create($validated + ['ordre' => $ordre]);
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

    /** Emploi du temps de l'étudiant connecté (semestre en cours déduit de son niveau). */
    public function monEmploiDuTemps(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->with('license')->firstOrFail();
        $semestre = $student->license
            ? Semestre::where('license_id', $student->license_id)->orderByDesc('numero_global')->first()
            : null;

        if (!$semestre) return response()->json(['creneaux' => []]);

        $creneaux = EmploiDuTemps::whereHas('matiere', fn ($q) => $q->whereHas('module', fn ($q2) => $q2->where('semestre_id', $semestre->id)))
            ->with(['matiere.module', 'matiere.professeur'])
            ->orderBy('jour')->orderBy('heure_debut')
            ->get();

        return response()->json(['semestre' => $semestre, 'creneaux' => $creneaux]);
    }

    // ── Notes ────────────────────────────────────────────────────────────────

    /** Saisie/mise à jour en masse des notes d'un étudiant pour un semestre donné. */
    public function saisirNotes(Request $request, Student $student)
    {
        $validated = $request->validate([
            'annee_scolaire' => 'required|string|max:20',
            'notes'          => 'required|array|min:1',
            'notes.*.matiere_id' => 'required|exists:matieres,id',
            'notes.*.note'        => 'required|numeric|min:0|max:20',
        ]);

        foreach ($validated['notes'] as $entry) {
            Note::updateOrCreate(
                ['student_id' => $student->id, 'matiere_id' => $entry['matiere_id'], 'annee_scolaire' => $validated['annee_scolaire']],
                ['note' => $entry['note'], 'saisi_par' => $request->user()->id]
            );
        }

        return response()->json(['message' => 'Notes enregistrées.']);
    }

    /** Bulletin calculé (moyennes, validation, mention) pour un étudiant + semestre. */
    public function bulletin(Semestre $semestre, Student $student, Request $request, BulletinService $bulletinService)
    {
        $anneeScolaire = $request->query('annee_scolaire', $student->annee_scolaire ?? date('Y') . '-' . (date('Y') + 1));
        return response()->json($bulletinService->detailSemestre($student, $semestre, $anneeScolaire));
    }
}
