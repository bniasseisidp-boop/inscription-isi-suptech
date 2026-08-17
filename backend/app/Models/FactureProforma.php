<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureProforma extends Model
{
    protected $table = 'factures_proforma';

    protected $fillable = ['reference', 'entreprise', 'beneficiaire', 'license_id', 'montant_total', 'created_by'];

    protected $casts = [
        'montant_total' => 'decimal:2',
    ];

    public function license()
    {
        return $this->belongsTo(License::class);
    }

    public function creePar()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
