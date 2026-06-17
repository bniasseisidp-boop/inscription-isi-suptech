<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('titre')->default('M.');
            $table->string('specialite');
            $table->string('photo')->nullable();
            $table->text('bio')->nullable();
            $table->string('email')->nullable();
            $table->string('linkedin')->nullable();
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('membres_admins', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('titre')->default('M.');
            $table->string('poste');
            $table->string('photo')->nullable();
            $table->string('email')->nullable();
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('partenaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('logo')->nullable();
            $table->string('site_web')->nullable();
            $table->text('description')->nullable();
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('temoignages', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('filiere')->nullable();
            $table->string('annee_diplome')->nullable();
            $table->text('contenu');
            $table->tinyInteger('note')->default(5);
            $table->string('photo')->nullable();
            $table->boolean('approuve')->default(false);
            $table->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('nom')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('temoignages');
        Schema::dropIfExists('partenaires');
        Schema::dropIfExists('membres_admins');
        Schema::dropIfExists('formateurs');
    }
};
