<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContenuCours extends Model
{
    protected $table = 'contenus_cours';

    protected $fillable = ['matiere_id', 'date', 'contenu', 'saisi_par'];

    protected $casts = ['date' => 'date'];

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }

    public function saisiPar()
    {
        return $this->belongsTo(User::class, 'saisi_par');
    }
}
