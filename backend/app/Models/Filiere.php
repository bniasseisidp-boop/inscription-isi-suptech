<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Filiere extends Model
{
    protected $fillable = ['nom', 'code', 'description', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function licenses()
    {
        return $this->hasMany(License::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }
}
