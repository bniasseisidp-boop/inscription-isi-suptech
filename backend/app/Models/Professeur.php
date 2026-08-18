<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Professeur extends Model
{
    protected $fillable = ['user_id', 'nom', 'prenom', 'email', 'telephone', 'specialite', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
