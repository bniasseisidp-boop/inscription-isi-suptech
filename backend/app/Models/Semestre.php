<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semestre extends Model
{
    protected $fillable = ['license_id', 'annee', 'numero', 'numero_global', 'libelle', 'credits_requis'];

    public function license()
    {
        return $this->belongsTo(License::class);
    }

    public function modules()
    {
        return $this->hasMany(Module::class)->orderBy('ordre');
    }

    /** Matieres attachees directement au semestre (sans UE) — filieres "calcul_simple" (BT, BTS...). */
    public function matieresDirectes()
    {
        return $this->hasMany(Matiere::class)->whereNull('module_id')->orderBy('ordre');
    }
}
