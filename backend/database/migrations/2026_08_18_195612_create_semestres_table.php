<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semestres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('license_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('annee');        // 1 = L1, 2 = L2, 3 = L3...
            $table->unsignedTinyInteger('numero');        // 1 ou 2 (semestre au sein de l'année)
            $table->unsignedTinyInteger('numero_global');  // 1 à 6 pour un cycle de 3 ans
            $table->string('libelle');                    // "Semestre 1"
            $table->unsignedTinyInteger('credits_requis')->default(30);
            $table->timestamps();

            $table->unique(['license_id', 'numero_global']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semestres');
    }
};
