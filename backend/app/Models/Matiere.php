<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    protected $fillable = [
        'module_id', 'professeur_id', 'code', 'nom',
        'cm', 'tp', 'td', 'tpe', 'vht', 'coef', 'credits', 'ordre',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
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
}
