<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['student_id', 'matiere_id', 'devoir1', 'devoir2', 'examen', 'annee_scolaire', 'saisi_par'];

    protected $casts = ['devoir1' => 'decimal:2', 'devoir2' => 'decimal:2', 'examen' => 'decimal:2'];

    /** MCC = moyenne des devoirs saisis (1 ou 2) — null si aucun n'est encore saisi. */
    public function getMccAttribute(): ?float
    {
        $devoirs = array_filter([$this->devoir1, $this->devoir2], fn ($v) => $v !== null);
        if (empty($devoirs)) return null;
        return round(array_sum(array_map('floatval', $devoirs)) / count($devoirs), 2);
    }

    /** Moyenne EC = MCC (40%, moyenne des devoirs) + Examen (60%), null tant que les deux ne sont pas saisis. */
    public function getMoyenneAttribute(): ?float
    {
        $mcc = $this->mcc;
        if ($mcc === null || $this->examen === null) return null;
        return round($mcc * 0.4 + (float) $this->examen * 0.6, 2);
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
