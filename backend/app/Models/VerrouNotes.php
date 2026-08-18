<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerrouNotes extends Model
{
    protected $table = 'verrous_notes';

    protected $fillable = ['semestre_id', 'annee_scolaire', 'verrouille', 'verrouille_par', 'verrouille_le'];

    protected $casts = ['verrouille' => 'boolean', 'verrouille_le' => 'datetime'];

    public function semestre()
    {
        return $this->belongsTo(Semestre::class);
    }

    public function verrouillePar()
    {
        return $this->belongsTo(User::class, 'verrouille_par');
    }
}
