<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentNotification extends Model
{
    protected $table = 'student_notifications';

    protected $fillable = ['student_id', 'titre', 'message', 'type', 'lu'];

    protected $casts = ['lu' => 'boolean'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
