<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('matiere_id')->constrained()->cascadeOnDelete();
            $table->decimal('note', 4, 2);
            $table->string('annee_scolaire'); // "2026-2027" — au cas où un etudiant redouble
            $table->foreignId('saisi_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'matiere_id', 'annee_scolaire']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
