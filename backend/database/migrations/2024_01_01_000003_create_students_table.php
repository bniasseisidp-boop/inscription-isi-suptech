<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('matricule')->unique()->nullable();
            $table->string('nom');
            $table->string('prenom');
            $table->string('telephone');
            $table->enum('sexe', ['M', 'F']);
            $table->date('date_naissance');
            $table->string('lieu_naissance');
            $table->string('adresse');
            $table->string('nationalite');
            $table->string('pays_residence');
            $table->string('photo')->nullable();
            $table->foreignId('filiere_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('license_id')->nullable()->constrained()->onDelete('set null');
            $table->string('annee_scolaire')->nullable();
            $table->enum('statut_inscription', ['en_attente', 'accepte', 'rejete'])->default('en_attente');
            $table->timestamp('date_acceptation')->nullable();
            $table->foreignId('accepte_par')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('inscription_payee')->default(false);
            $table->string('qr_code_path')->nullable();
            $table->text('notes_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
