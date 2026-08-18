<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploiDuTemps extends Model
{
    protected $table = 'emplois_du_temps';

    protected $fillable = ['matiere_id', 'jour', 'heure_debut', 'heure_fin', 'salle'];

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }
}
