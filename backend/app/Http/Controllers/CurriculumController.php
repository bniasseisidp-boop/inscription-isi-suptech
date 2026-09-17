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
        $matiere = $module->matieres()->create(array_filter($validated, fn ($v) => $v !== null) + ['ordre' => $ordre]);
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
        $matiere = $semestre->matieresDirectes()->create(array_filter($validated, fn ($v) => $v !== null) + ['ordre' => $ordre]);
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
        /**
     * Récupère tous les bulletins du cursus complet de l'étudiant connecté (multi-années).
     */
    public function mesBulletins(Request $request, BulletinService $bulletinService)
    {
        $student = Student::where('user_id', $request->user()->id)->with(['license.semestres.modules.matieres', 'filiere', 'notes.matiere'])->firstOrFail();
        
        // 1. Récupérer l'ensemble des années disponibles dans son cursus
        $jsonPath = file_exists(storage_path('app/canonical_all_students.json')) 
            ? storage_path('app/canonical_all_students.json') 
            : (file_exists(storage_path('canonical_all_students.json')) ? storage_path('canonical_all_students.json') : base_path('storage/app/canonical_all_students.json'));
        
        static $canonicalCache = null;
        if ($canonicalCache === null && file_exists($jsonPath)) {
            $canonicalCache = json_decode(file_get_contents($jsonPath), true) ?: [];
        }

        $mat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $student->matricule ?? ''));
        $matchedRecords = [];
        if (!empty($canonicalCache)) {
            foreach ($canonicalCache as $c) {
                $cMat = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $c['matricule'] ?? ''));
                $cName = strtolower(trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')));
                $studentName = strtolower(trim(($student->prenom ?? '') . ' ' . ($student->nom ?? '')));
                if ((!empty($mat) && $mat === $cMat) || ($studentName && $studentName === $cName)) {
                    $matchedRecords[] = $c;
                }
            }
        }

        if (empty($matchedRecords) && !empty($student->dossiers_historique)) {
            $matchedRecords = is_array($student->dossiers_historique) ? $student->dossiers_historique : json_decode($student->dossiers_historique, true);
        }

        // Liste des années cursus
        $anneesCursus = [];
        $dossiersByYear = [];
        if (!empty($matchedRecords)) {
            foreach ($matchedRecords as $r) {
                $yr = trim($r['annee'] ?? $r['annee_universitaire'] ?? '2024-2025');
                $niv = trim($r['classe'] ?? $r['niveau'] ?? ($student->license?->nom ?? 'Licence'));
                $fil = trim($r['filiere'] ?? ($student->filiere?->nom ?? 'Informatique'));
                $moy = floatval($r['moyenne_generale'] ?? $student->moyenne_generale ?? 0);
                $anneesCursus[$yr] = [
                    'annee'   => $yr,
                    'classe'  => $niv,
                    'filiere' => $fil,
                    'moyenne' => $moy,
                    'credits' => intval($r['credits_total'] ?? 60),
                ];
                $dossiersByYear[$yr] = $r;
            }
        }

        // Ajouter l'année courante si non présente
        $currYear = $student->annee_scolaire ?: '2026-2027';
        if (!isset($anneesCursus[$currYear])) {
            $anneesCursus[$currYear] = [
                'annee'   => $currYear,
                'classe'  => $student->license?->nom ?? 'Licence',
                'filiere' => $student->filiere?->nom ?? 'Informatique',
                'moyenne' => floatval($student->moyenne_generale ?? 0),
                'credits' => intval($student->credits_total ?? 60),
            ];
        }

        $anneesCursusList = array_values($anneesCursus);

        // Déterminer l'année demandée
        $reqYear = $request->query('annee_scolaire') ?? $request->query('annee');
        if (!$reqYear || !isset($anneesCursus[$reqYear])) {
            $reqYear = !empty($dossiersByYear) ? array_key_first($dossiersByYear) : $currYear;
        }

        $calculSimple = (bool) $student->license?->calcul_simple;
        $bulletins = [];

        // Si l'année demandée est dans les dossiers historiques / canonical
        if (isset($dossiersByYear[$reqYear])) {
            $dossier = $dossiersByYear[$reqYear];
            $semLabels = $dossier['semestres_dossier'] ?? ['S1', 'S2'];
            
            // Regrouper les matières/modules par semestre
            $modulesBySem = [];
            if (!empty($dossier['modules']) && is_array($dossier['modules'])) {
                foreach ($dossier['modules'] as $m) {
                    $sKey = trim($m['semestre'] ?? 'S1');
                    $modulesBySem[$sKey][] = $m;
                }
            }

            foreach ($semLabels as $sIdx => $sKey) {
                $semNum = ($sIdx + 1);
                $sAvg = ($sKey === 'S1' || $semNum === 1) ? floatval($dossier['moyenne_s1'] ?? 0) : floatval($dossier['moyenne_s2'] ?? 0);
                $sCred = ($sKey === 'S1' || $semNum === 1) ? intval($dossier['credits_s1'] ?? 30) : intval($dossier['credits_s2'] ?? 30);
                $sApp = ($sKey === 'S1' || $semNum === 1) ? ($dossier['appreciation_s1'] ?? 'Bon Travail') : ($dossier['appreciation_s2'] ?? 'Très Bon travail');

                $modsList = [];
                $lignesSimples = [];
                $modsRaw = $modulesBySem[$sKey] ?? [];

                foreach ($modsRaw as $modRaw) {
                    $lignes = [];
                    $totPondere = 0;
                    $matieresRaw = $modRaw['matieres'] ?? [];
                    foreach ($matieresRaw as $matRaw) {
                        $cc = isset($matRaw['cc']) ? floatval($matRaw['cc']) : null;
                        $exam = isset($matRaw['exam']) ? floatval($matRaw['exam']) : null;
                        $moy = isset($matRaw['moy']) ? floatval($matRaw['moy']) : (($cc !== null && $exam !== null) ? round(($cc * 0.4) + ($exam * 0.6), 2) : null);
                        $coef = floatval($matRaw['coeff'] ?? $matRaw['coef'] ?? 2);
                        $cred = floatval($matRaw['credits'] ?? 2.5);
                        $moyCoef = $moy !== null ? round($moy * $coef, 2) : null;
                        $appr = $matRaw['appreciation'] ?? ($moy !== null ? $bulletinService->appreciationDe($moy) : '-');

                        $ligneItem = [
                            'matiere' => (object)[
                                'id'      => $matRaw['id'] ?? null,
                                'nom'     => $matRaw['matiere'] ?? 'Matière',
                                'code'    => $matRaw['code'] ?? '',
                                'coef'    => $coef,
                                'credits' => $cred,
                            ],
                            'mcc'              => $cc,
                            'examen'           => $exam,
                            'compo'            => $exam,
                            'moy_cont'         => $cc,
                            'moyenne_ec'       => $moy,
                            'moyenne_generale' => $moy,
                            'moyenne_coef'     => $moyCoef,
                            'appreciation'     => $appr,
                            'val'              => $matRaw['val'] ?? ($moy >= 10 ? 'VALIDÉ' : 'NON VALIDÉ'),
                        ];
                        $lignes[] = $ligneItem;
                        $lignesSimples[] = $ligneItem;
                        if ($moyCoef !== null) $totPondere += $moyCoef;
                    }

                    $moyUe = floatval($modRaw['moy_ue'] ?? ($modRaw['moyenne'] ?? ($lignes ? round($totPondere / max(1, count($lignes) * 2), 2) : 0)));
                    $ueCredits = floatval($modRaw['ue_credits'] ?? 6);
                    $modsList[] = [
                        'module' => (object)[
                            'id'      => $modRaw['ue_nom'] ?? ('UE-' . $sKey),
                            'nom'     => $modRaw['ue_nom'] ?? 'Unité d'Enseignement',
                            'code'    => $modRaw['ue_nom'] ?? '',
                            'credits' => $ueCredits,
                        ],
                        'lignes'            => $lignes,
                        'total_moyenne_coef'=> $totPondere,
                        'moyenne_ue'        => $moyUe,
                        'valide'            => $moyUe >= 10.0,
                    ];
                }

                $bulletins[] = [
                    'semestre' => (object)[
                        'id'            => $sKey,
                        'numero'        => $semNum,
                        'numero_global' => $semNum,
                        'annee'         => substr($reqYear, 0, 4),
                        'libelle'       => "Semestre {$semNum} ({$sKey})",
                    ],
                    'annee_scolaire'       => $reqYear,
                    'moyenne_semestre'     => $sAvg,
                    'moyenne_generale'     => $sAvg,
                    'credits_requis'       => 30,
                    'credits_obtenus'      => $sCred,
                    'valide'               => $sAvg >= 10.0,
                    'mention'              => $bulletinService->mentionDe($sAvg),
                    'appreciation'         => $sApp,
                    'modules'              => $modsList,
                    'lignes'               => $lignesSimples,
                ];
            }
        } elseif ($student->license_id) {
            // Année courante connectée aux semestres en base
            $semestres = Semestre::where('license_id', $student->license_id)->orderBy('numero_global')->get();
            $bulletins = $semestres->map(fn ($s) => $calculSimple
                ? $bulletinService->detailSemestreSimple($student, $s, $reqYear)
                : $bulletinService->detailSemestre($student, $s, $reqYear));
        }

        return response()->json([
            'annee_scolaire' => $reqYear,
            'annees_cursus'  => $anneesCursusList,
            'calcul_simple'  => $calculSimple,
            'bulletins'      => $bulletins,
            'student'        => [
                'matricule'   => $student->matricule,
                'nom_complet' => $student->full_name,
                'filiere'     => $student->filiere?->nom,
                'classe'      => $student->license?->nom,
            ]
        ]);
    }

    /**
     * Téléchargement du PDF officiel d'un bulletin du cursus (actuel ou historique).
     */
    public function telechargerMonBulletin(Request $request, $semestre, PDFService $pdfService, BulletinService $bulletinService)
    {
        $student = Student::where('user_id', $request->user()->id)->with(['license', 'filiere'])->firstOrFail();
        $anneeScolaire = $request->query('annee_scolaire', $student->annee_scolaire ?? '2024-2025');

        // 1. Si le paramètre est un ID numérique de Semestre en base
        if (is_numeric($semestre)) {
            $semestreObj = Semestre::find($semestre);
            if ($semestreObj) {
                $path = $student->license?->calcul_simple
                    ? $pdfService->generateBulletinSimple($student, $semestreObj, $anneeScolaire, null)
                    : $pdfService->generateBulletin($student, $semestreObj, $anneeScolaire, null);
                $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);
                if (file_exists($full)) {
                    return response()->file($full, [
                        'Content-Type'        => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="bulletin_S' . $semestreObj->numero_global . '.pdf"',
                    ]);
                }
            }
        }

        // 2. Si c'est un code semestre (ex: S1, S2) ou un bulletin historique de son cursus
        $semKey = strtoupper(trim((string)$semestre));
        $semNum = ($semKey === 'S2' || $semKey === '2') ? 2 : 1;
        $semObj = (object)[
            'id'            => $semKey,
            'numero'        => $semNum,
            'numero_global' => $semNum,
            'annee'         => substr($anneeScolaire, 0, 4),
            'libelle'       => "Semestre {$semNum} ({$semKey})",
        ];

        // Charger les données du bulletin via mesBulletins
        $bulletinsData = $this->mesBulletins(new Request(['annee_scolaire' => $anneeScolaire]), $bulletinService)->getData(true);
        $targetBulletin = null;
        if (!empty($bulletinsData['bulletins'])) {
            foreach ($bulletinsData['bulletins'] as $b) {
                if (strtoupper($b['semestre']['id'] ?? '') === $semKey || intval($b['semestre']['numero'] ?? 0) === $semNum) {
                    $targetBulletin = $b;
                    break;
                }
            }
        }

        if (!$targetBulletin && !empty($bulletinsData['bulletins'])) {
            $targetBulletin = $bulletinsData['bulletins'][0];
        }

        if ($targetBulletin) {
            $path = $pdfService->generateBulletinDataPdf($student, $semObj, $targetBulletin, $anneeScolaire);
            $full = \Illuminate\Support\Facades\Storage::disk('public')->path($path);
            if (file_exists($full)) {
                return response()->file($full, [
                    'Content-Type'        => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="bulletin_' . $semKey . '_' . preg_replace('/[^0-9]/', '', $anneeScolaire) . '.pdf"',
                ]);
            }
        }

        return response()->json(['message' => 'Impossible de générer le bulletin pour ce semestre.'], 404);
    }

    /** Grand tableau de d public function conseilClasse(Semestre $semestre, Request $request, BulletinService $bulletinService)
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
            $mcc = isset($entry['mcc']) && $entry['mcc'] !== '' && $entry['mcc'] !== null ? floatval($entry['mcc']) : null;
            $examen = isset($entry['examen']) && $entry['examen'] !== '' && $entry['examen'] !== null ? floatval($entry['examen']) : null;

            if ($mcc === null && $examen === null) {
                // If both are cleared, remove or set null
                Note::where('student_id', $student->id)
                    ->where('matiere_id', $entry['matiere_id'])
                    ->where('annee_scolaire', $validated['annee_scolaire'])
                    ->delete();
            } else {
                Note::updateOrCreate(
                    ['student_id' => $student->id, 'matiere_id' => $entry['matiere_id'], 'annee_scolaire' => $validated['annee_scolaire']],
                    [
                        'mcc'       => $mcc,
                        'examen'    => $examen,
                        'saisi_par' => $request->user()?->id,
                    ]
                );
            }
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
        public function downloadBulletin($semestre, Student $student, Request $request, \App\Services\PDFService $pdfService)
    {
        // Resolve Semestre if string or model
        if (!($semestre instanceof Semestre) || !$semestre->exists) {
            $semNum = is_numeric($semestre) ? intval($semestre) : intval(preg_replace('/[^0-9]/', '', (string)$semestre));
            $resolved = null;
            if ($semNum > 0) {
                $resolved = $student->license?->semestres()->where('numero', $semNum)->first()
                    ?? Semestre::where('numero', $semNum)->first();
            }
            if (!$resolved && is_numeric($semestre)) {
                $resolved = Semestre::find($semestre);
            }
            if (!$resolved) {
                $resolved = $student->license?->semestres()->first() ?? Semestre::first();
            }
            $semestre = $resolved;
        }

        if (!$semestre) {
            return response()->json(['message' => 'Semestre introuvable pour ce bulletin.'], 404);
        }

        $isStaff = $request->user() && in_array($request->user()->role, ['admin', 'pedagogique', 'cashier']);
        if (!$isStaff && !$student->estEnRegle()) {
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
            'Content-Disposition' => 'inline; filename="bulletin_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', ($student->matricule ?? $student->id)) . '_S' . ($semestre->numero_global ?? $semestre->numero ?? 1) . '.pdf"',
        ]);
    }
}
