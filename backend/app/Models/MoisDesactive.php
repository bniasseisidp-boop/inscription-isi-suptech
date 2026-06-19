<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoisDesactive extends Model
{
    protected $table = 'mois_desactives';

    protected $fillable = ['mois', 'raison', 'desactive_par'];
}
