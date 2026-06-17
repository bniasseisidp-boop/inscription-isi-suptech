<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    protected $fillable = ['filiere_id', 'nom', 'code', 'duree_annees', 'frais_inscription', 'frais_mensuel', 'actif'];

    protected $casts = [
        'frais_inscription' => 'decimal:2',
        'frais_mensuel' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }
}
