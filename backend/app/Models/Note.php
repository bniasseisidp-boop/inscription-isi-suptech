<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['student_id', 'matiere_id', 'note', 'annee_scolaire', 'saisi_par'];

    protected $casts = ['note' => 'decimal:2'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }

    public function saisiPar()
    {
        return $this->belongsTo(User::class, 'saisi_par');
    }
}
