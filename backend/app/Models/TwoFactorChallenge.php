<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TwoFactorChallenge extends Model
{
    protected $fillable = ['token', 'user_id', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
