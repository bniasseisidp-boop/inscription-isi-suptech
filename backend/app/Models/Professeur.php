<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Professeur extends Model
{
    protected $fillable = ['nom', 'prenom', 'email', 'telephone', 'specialite', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
