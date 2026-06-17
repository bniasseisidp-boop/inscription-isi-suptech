<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'student_id', 'type', 'montant', 'mois', 'annee',
        'wave_checkout_id', 'wave_session_id', 'wave_transaction_id',
        'statut', 'date_paiement', 'methode', 'recu_pdf_path',
        'recu_email_envoye', 'saisi_par', 'notes',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant' => 'decimal:2',
        'recu_email_envoye' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function saiseur()
    {
        return $this->belongsTo(User::class, 'saisi_par');
    }

    public function getLibelleAttribute(): string
    {
        return match($this->type) {
            'inscription' => 'Frais d\'inscription',
            'mensualite'  => 'Mensualité ' . $this->mois,
            default       => 'Paiement',
        };
    }
}
