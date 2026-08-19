<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RappelCours extends Model
{
    protected $table = 'rappels_cours';
    public $timestamps = false;

    protected $fillable = ['creneau_id', 'date', 'envoye_le'];

    protected $casts = ['date' => 'date', 'envoye_le' => 'datetime'];
}
