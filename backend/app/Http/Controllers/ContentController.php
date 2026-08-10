<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    // ── PUBLIC ────────────────────────────────────────────────────────────────

    public function getFormateurs()
    {
        $rows = DB::table('formateurs')->where('actif', true)->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => [
            'id'         => $r->id,
            'nom'        => $r->nom,
            'prenom'     => $r->prenom,
            'titre'      => $r->titre,
            'specialite' => $r->specialite,
            'bio'        => $r->bio,
            'email'      => $r->email,
            'linkedin'   => $r->linkedin,
            'photo'      => $r->photo ? Storage::url($r->photo) : null,
        ]));
    }

    public function getMembresAdmins()
    {
        $rows = DB::table('membres_admins')->where('actif', true)->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => [
            'id'     => $r->id,
            'nom'    => $r->nom,
            'prenom' => $r->prenom,
            'titre'  => $r->titre,
            'poste'  => $r->poste,
            'email'  => $r->email,
            'photo'  => $r->photo ? Storage::url($r->photo) : null,
        ]));
    }

    public function getPartenaires()
    {
        $rows = DB::table('partenaires')->where('actif', true)->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => [
            'id'          => $r->id,
            'nom'         => $r->nom,
            'description' => $r->description,
            'site_web'    => $r->site_web,
            'logo'        => $r->logo ? Storage::url($r->logo) : null,
        ]));
    }

    public function getTemoignages()
    {
        $rows = DB::table('temoignages')->where('approuve', true)->latest()->get();
        return response()->json($rows->map(fn($r) => [
            'id'           => $r->id,
            'nom'          => $r->nom,
            'filiere'      => $r->filiere,
            'annee_diplome'=> $r->annee_diplome,
            'contenu'      => $r->contenu,
            'note'         => $r->note,
            'photo'        => $r->photo ? Storage::url($r->photo) : null,
        ]));
    }

    public function submitTemoignage(Request $request)
    {
        $data = $request->validate([
            'nom'           => 'required|string|max:100',
            'filiere'       => 'nullable|string|max:100',
            'annee_diplome' => 'nullable|string|max:10',
            'contenu'       => 'required|string|min:20|max:1000',
            'note'          => 'required|integer|min:1|max:5',
        ]);

        // Si l'auteur est connecté en tant qu'étudiant (jeton Sanctum envoyé mais
        // route publique, pas de middleware auth requis), on relie sa vraie photo
        // de profil déjà uploadée dans son espace étudiant — sans rien demander
        // de plus dans le formulaire public.
        $photo = null;
        $user = \Illuminate\Support\Facades\Auth::guard('sanctum')->user();
        if ($user && $user->role === 'student') {
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            $photo = $student?->photo;
        }

        $id = DB::table('temoignages')->insertGetId([...$data, 'photo' => $photo, 'approuve' => false, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'Témoignage soumis, en attente de modération.', 'id' => $id], 201);
    }

    public function subscribeNewsletter(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:150',
            'nom'   => 'nullable|string|max:100',
        ]);

        DB::table('newsletter_subscribers')->updateOrInsert(
            ['email' => $data['email']],
            ['nom' => $data['nom'] ?? null, 'actif' => true, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'Inscription à la newsletter confirmée !']);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    // --- Formateurs ---
    public function adminFormateurs()
    {
        $rows = DB::table('formateurs')->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => array_merge((array)$r, [
            'photo' => $r->photo ? Storage::url($r->photo) : null,
        ])));
    }

    public function createFormateur(Request $request)
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:100',
            'prenom'     => 'required|string|max:100',
            'titre'      => 'required|string|max:20',
            'specialite' => 'required|string|max:200',
            'bio'        => 'nullable|string|max:1000',
            'email'      => 'nullable|email|max:150',
            'linkedin'   => 'nullable|url|max:300',
            'ordre'      => 'integer|min:0',
            'photo'      => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('formateurs', 'public');
        }

        $id = DB::table('formateurs')->insertGetId([...$data, 'actif' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Formateur ajouté.', 'id' => $id], 201);
    }

    public function updateFormateur(Request $request, $id)
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:100',
            'prenom'     => 'required|string|max:100',
            'titre'      => 'required|string|max:20',
            'specialite' => 'required|string|max:200',
            'bio'        => 'nullable|string|max:1000',
            'email'      => 'nullable|email|max:150',
            'linkedin'   => 'nullable|url|max:300',
            'ordre'      => 'integer|min:0',
            'actif'      => 'boolean',
            'photo'      => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $old = DB::table('formateurs')->where('id', $id)->value('photo');
            if ($old) Storage::disk('public')->delete($old);
            $data['photo'] = $request->file('photo')->store('formateurs', 'public');
        }

        DB::table('formateurs')->where('id', $id)->update([...$data, 'updated_at' => now()]);
        return response()->json(['message' => 'Formateur mis à jour.']);
    }

    public function deleteFormateur($id)
    {
        $photo = DB::table('formateurs')->where('id', $id)->value('photo');
        if ($photo) Storage::disk('public')->delete($photo);
        DB::table('formateurs')->where('id', $id)->delete();
        return response()->json(['message' => 'Formateur supprimé.']);
    }

    // --- Membres admin ---
    public function adminMembres()
    {
        $rows = DB::table('membres_admins')->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => array_merge((array)$r, [
            'photo' => $r->photo ? Storage::url($r->photo) : null,
        ])));
    }

    public function createMembre(Request $request)
    {
        $data = $request->validate([
            'nom'    => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'titre'  => 'required|string|max:20',
            'poste'  => 'required|string|max:200',
            'email'  => 'nullable|email|max:150',
            'ordre'  => 'integer|min:0',
            'photo'  => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('membres', 'public');
        }

        $id = DB::table('membres_admins')->insertGetId([...$data, 'actif' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Membre ajouté.', 'id' => $id], 201);
    }

    public function deleteMembre($id)
    {
        $photo = DB::table('membres_admins')->where('id', $id)->value('photo');
        if ($photo) Storage::disk('public')->delete($photo);
        DB::table('membres_admins')->where('id', $id)->delete();
        return response()->json(['message' => 'Membre supprimé.']);
    }

    // --- Partenaires ---
    public function adminPartenaires()
    {
        $rows = DB::table('partenaires')->orderBy('ordre')->orderBy('nom')->get();
        return response()->json($rows->map(fn($r) => array_merge((array)$r, [
            'logo' => $r->logo ? Storage::url($r->logo) : null,
        ])));
    }

    public function createPartenaire(Request $request)
    {
        $data = $request->validate([
            'nom'         => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'site_web'    => 'nullable|url|max:300',
            'ordre'       => 'integer|min:0',
            'logo'        => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('partenaires', 'public');
        }

        $id = DB::table('partenaires')->insertGetId([...$data, 'actif' => true, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Partenaire ajouté.', 'id' => $id], 201);
    }

    public function deletePartenaire($id)
    {
        $logo = DB::table('partenaires')->where('id', $id)->value('logo');
        if ($logo) Storage::disk('public')->delete($logo);
        DB::table('partenaires')->where('id', $id)->delete();
        return response()->json(['message' => 'Partenaire supprimé.']);
    }

    // --- Témoignages ---
    public function adminTemoignages()
    {
        $rows = DB::table('temoignages')->latest()->get();
        return response()->json($rows->map(function ($r) {
            $r->photo = $r->photo ? Storage::url($r->photo) : null;
            return $r;
        }));
    }

    public function approuverTemoignage($id)
    {
        DB::table('temoignages')->where('id', $id)->update(['approuve' => true, 'updated_at' => now()]);
        return response()->json(['message' => 'Témoignage approuvé.']);
    }

    public function deleteTemoignage($id)
    {
        DB::table('temoignages')->where('id', $id)->delete();
        return response()->json(['message' => 'Témoignage supprimé.']);
    }

    // --- Newsletter ---
    public function newsletterSubscribers()
    {
        return response()->json(DB::table('newsletter_subscribers')->latest()->get());
    }

    /** Diffuse une annonce par email à tous les abonnés actifs de la newsletter. */
    public function sendNewsletterAnnouncement(Request $request)
    {
        $data = $request->validate([
            'sujet' => 'required|string|max:200',
            'corps' => 'required|string|max:5000',
        ]);

        $abonnes = DB::table('newsletter_subscribers')->where('actif', true)->get();

        $envoyes = 0;
        $echecs  = 0;
        foreach ($abonnes as $abonne) {
            try {
                \Illuminate\Support\Facades\Mail::to($abonne->email)
                    ->send(new \App\Mail\NewsletterAnnouncement($data['sujet'], $data['corps'], $abonne->nom));
                $envoyes++;
            } catch (\Exception $e) {
                $echecs++;
                \Log::warning('Envoi newsletter à ' . $abonne->email . ': ' . $e->getMessage());
            }
        }

        \App\Services\ActivityLogger::log(
            $request->user(), 'newsletter.broadcast',
            "Annonce newsletter envoyée : « {$data['sujet']} » — {$envoyes} envoyé(s), {$echecs} échec(s)."
        );

        return response()->json(['message' => "Annonce envoyée à {$envoyes} abonné(s).", 'envoyes' => $envoyes, 'echecs' => $echecs]);
    }

    // --- Social / Settings ---
    public function getSocialSettings()
    {
        $rows = DB::table('site_settings')
            ->whereIn('cle', ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'])
            ->get()->pluck('valeur', 'cle');
        return response()->json($rows);
    }

    public function updateSocialSettings(Request $request)
    {
        $data = $request->validate([
            'facebook'  => 'nullable|url|max:300',
            'instagram' => 'nullable|url|max:300',
            'tiktok'    => 'nullable|url|max:300',
            'youtube'   => 'nullable|url|max:300',
            'linkedin'  => 'nullable|url|max:300',
            'twitter'   => 'nullable|url|max:300',
        ]);

        foreach ($data as $cle => $valeur) {
            DB::table('site_settings')->updateOrInsert(
                ['cle' => $cle],
                ['valeur' => $valeur ?? '', 'updated_at' => now(), 'created_at' => now()]
            );
        }

        return response()->json(['message' => 'Réseaux sociaux mis à jour.']);
    }

    // --- Blocs de contenu éditables (textes + photos des sections existantes) ──
    // Le super admin modifie le texte/la photo d'une section existante (hero,
    // carrousel "Soutenances & Diplômes"…) sans jamais toucher au code : chaque
    // bloc est une simple clé whitelistée, stockée dans site_settings (texte)
    // ou comme chemin de fichier (photo). Pas d'ajout/suppression de sections —
    // uniquement modifier ce qui existe déjà.
    private const CONTENT_BLOCK_TEXT_KEYS = [
        'hero_badge', 'hero_titre_1', 'hero_titre_accent', 'hero_titre_2', 'hero_sous_titre',
        'slide_1_titre', 'slide_1_sous', 'slide_2_titre', 'slide_2_sous',
        'slide_3_titre', 'slide_3_sous', 'slide_4_titre', 'slide_4_sous', 'slide_5_titre', 'slide_5_sous',
    ];
    private const CONTENT_BLOCK_IMAGE_KEYS = [
        'slide_1_image', 'slide_2_image', 'slide_3_image', 'slide_4_image', 'slide_5_image',
    ];

    public function getContentBlocks()
    {
        $cles = array_merge(self::CONTENT_BLOCK_TEXT_KEYS, self::CONTENT_BLOCK_IMAGE_KEYS);
        $rows = DB::table('site_settings')->whereIn('cle', $cles)->pluck('valeur', 'cle');

        $result = [];
        foreach (self::CONTENT_BLOCK_TEXT_KEYS as $cle) {
            $result[$cle] = $rows[$cle] ?? null;
        }
        foreach (self::CONTENT_BLOCK_IMAGE_KEYS as $cle) {
            $result[$cle] = isset($rows[$cle]) ? '/storage/' . $rows[$cle] : null;
        }

        return response()->json($result);
    }

    public function updateContentBlockText(Request $request)
    {
        $data = $request->validate([
            'cle'    => 'required|string|in:' . implode(',', self::CONTENT_BLOCK_TEXT_KEYS),
            'valeur' => 'required|string|max:2000',
        ]);

        DB::table('site_settings')->updateOrInsert(
            ['cle' => $data['cle']],
            ['valeur' => $data['valeur'], 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'Bloc mis à jour.']);
    }

    public function updateContentBlockImage(Request $request)
    {
        $data = $request->validate([
            'cle'   => 'required|string|in:' . implode(',', self::CONTENT_BLOCK_IMAGE_KEYS),
            'photo' => 'required|image|max:4096',
        ]);

        $ancien = DB::table('site_settings')->where('cle', $data['cle'])->value('valeur');
        if ($ancien && Storage::disk('public')->exists($ancien)) {
            Storage::disk('public')->delete($ancien);
        }

        $path = $request->file('photo')->store('contenu', 'public');
        DB::table('site_settings')->updateOrInsert(
            ['cle' => $data['cle']],
            ['valeur' => $path, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['message' => 'Photo mise à jour.', 'url' => '/storage/' . $path]);
    }

    // --- Chiffres clés du site (page d'accueil, page témoignages…) ─────────────
    // Source unique : modifiable uniquement par le super admin, affichée partout
    // sur le site public sans jamais toucher au code.
    public function getStats()
    {
        $defaults = ['stat_etudiants' => '2500', 'stat_experience' => '15', 'stat_insertion' => '95', 'stat_filieres' => '20'];
        $rows = DB::table('site_settings')->whereIn('cle', array_keys($defaults))->pluck('valeur', 'cle');
        return response()->json(array_merge($defaults, $rows->toArray()));
    }

    public function updateStats(Request $request)
    {
        $data = $request->validate([
            'stat_etudiants'  => 'required|string|max:20',
            'stat_experience' => 'required|string|max:20',
            'stat_insertion'  => 'required|string|max:20',
            'stat_filieres'   => 'required|string|max:20',
        ]);

        foreach ($data as $cle => $valeur) {
            DB::table('site_settings')->updateOrInsert(
                ['cle' => $cle],
                ['valeur' => $valeur, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        return response()->json(['message' => 'Chiffres du site mis à jour.']);
    }

    // --- Filière detail (public, with licenses) ---
    public function filiereDetail($id)
    {
        $filiere = DB::table('filieres')->where('id', $id)->first();
        if (!$filiere) return response()->json(['message' => 'Not found'], 404);

        $licenses = DB::table('licenses')->where('filiere_id', $id)->orderBy('nom')->get();

        return response()->json(array_merge((array)$filiere, ['licenses' => $licenses]));
    }
}
