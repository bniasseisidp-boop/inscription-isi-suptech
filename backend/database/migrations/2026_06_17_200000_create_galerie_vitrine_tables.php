<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Photos de la galerie campus
        Schema::create('galerie', function (Blueprint $table) {
            $table->id();
            $table->string('titre')->nullable();
            $table->string('legende')->nullable();
            $table->string('image');
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        // Slides du carousel hero (vitrines)
        Schema::create('vitrines', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->string('sous_titre')->nullable();
            $table->string('image');
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vitrines');
        Schema::dropIfExists('galerie');
    }
};
