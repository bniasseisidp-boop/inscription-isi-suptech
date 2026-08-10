<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'actif'];

    protected $hidden = ['password', 'remember_token', 'two_factor_code'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'actif' => 'boolean',
        'two_factor_code_expires_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? '/storage/' . $this->photo : null;
    }

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isCashier(): bool  { return $this->role === 'cashier'; }
    public function isStudent(): bool  { return $this->role === 'student'; }
    public function isAccueil(): bool  { return $this->role === 'accueil'; }

    /**
     * Le lien de réinitialisation doit pointer vers le frontend React (SPA),
     * pas vers une route web Laravel — cette API n'en sert aucune.
     */
    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('app.frontend_url'), '/')
            . '/reinitialiser-mot-de-passe?token=' . $token . '&email=' . urlencode($this->email);

        try {
            \Illuminate\Support\Facades\Mail::to($this->email)->send(new \App\Mail\ResetPasswordMail($url));
        } catch (\Exception $e) {
            \Log::warning('Email réinitialisation mot de passe: ' . $e->getMessage());
        }
    }
}
