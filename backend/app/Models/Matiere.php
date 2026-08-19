<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    protected $fillable = [
        'module_id', 'semestre_id', 'professeur_id', 'code', 'nom',
        'cm', 'tp', 'td', 'tpe', 'vht', 'coef', 'credits', 'ordre',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    /** Semestre parent direct — uniquement pour les matieres "sans UE" (filieres calcul_simple). */
    public function semestre()
    {
        return $this->belongsTo(Semestre::class);
    }

    public function professeur()
    {
        return $this->belongsTo(Professeur::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function creneaux()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function presences()
    {
        return $this->hasMany(Presence::class);
    }

    /** "Cahier de texte" — grandes lignes de ce que le prof a enseigne, seance par seance. */
    public function contenusCours()
    {
        return $this->hasMany(ContenuCours::class);
    }

    /** Semestre parent, que la matiere soit rattachee via une UE (module) ou
     *  directement au semestre (filieres "calcul_simple" sans UE). */
    public function semestreResolu(): Semestre
    {
        if ($this->module_id) {
            $this->loadMissing('module.semestre');
            return $this->module->semestre;
        }
        $this->loadMissing('semestre');
        return $this->semestre;
    }
}
