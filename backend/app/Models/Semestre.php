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
}
