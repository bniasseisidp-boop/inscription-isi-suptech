<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentEditRequest extends Model
{
    protected $fillable = [
        'payment_id', 'requested_by', 'motif', 'statut', 'decided_by', 'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function demandeur()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function decideur()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
