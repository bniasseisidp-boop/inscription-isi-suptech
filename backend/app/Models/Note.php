<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['student_id', 'matiere_id', 'mcc', 'examen', 'annee_scolaire', 'saisi_par'];

    protected $casts = ['mcc' => 'decimal:2', 'examen' => 'decimal:2'];

    /** Moyenne EC = MCC (40%) + Examen (60%), null tant que les deux ne sont pas saisis. */
    public function getMoyenneAttribute(): ?float
    {
        if ($this->mcc === null || $this->examen === null) return null;
        return round((float) $this->mcc * 0.4 + (float) $this->examen * 0.6, 2);
    }

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
