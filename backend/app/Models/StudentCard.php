<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCard extends Model
{
    protected $fillable = [
        'student_id', 'numero_carte', 'qr_code_data', 'qr_code_image',
        'annee_validite', 'actif', 'date_generation', 'qr_pdf_path',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'date_generation' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
