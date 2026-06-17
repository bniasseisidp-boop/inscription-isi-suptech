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

        $id = DB::table('temoignages')->insertGetId([...$data, 'approuve' => false, 'created_at' => now(), 'updated_at' => now()]);

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
        return response()->json(DB::table('temoignages')->latest()->get());
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

    // --- Filière detail (public, with licenses) ---
    public function filiereDetail($id)
    {
        $filiere = DB::table('filieres')->where('id', $id)->first();
        if (!$filiere) return response()->json(['message' => 'Not found'], 404);

        $licenses = DB::table('licenses')->where('filiere_id', $id)->orderBy('nom')->get();

        return response()->json(array_merge((array)$filiere, ['licenses' => $licenses]));
    }
}
