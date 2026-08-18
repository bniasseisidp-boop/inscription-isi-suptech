<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verrous_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semestre_id')->constrained('semestres')->cascadeOnDelete();
            $table->string('annee_scolaire', 20);
            $table->boolean('verrouille')->default(false);
            $table->foreignId('verrouille_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verrouille_le')->nullable();
            $table->timestamps();

            $table->unique(['semestre_id', 'annee_scolaire']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verrous_notes');
    }
};
