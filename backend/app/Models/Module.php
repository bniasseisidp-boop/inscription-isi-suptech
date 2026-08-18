<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = ['semestre_id', 'code', 'nom', 'credits', 'ordre'];

    public function semestre()
    {
        return $this->belongsTo(Semestre::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class)->orderBy('ordre');
    }
}
