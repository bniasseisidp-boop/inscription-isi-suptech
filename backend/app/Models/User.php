<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'actif'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'actif' => 'boolean',
    ];

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isCashier(): bool  { return $this->role === 'cashier'; }
    public function isStudent(): bool  { return $this->role === 'student'; }
    public function isAccueil(): bool  { return $this->role === 'accueil'; }
}
