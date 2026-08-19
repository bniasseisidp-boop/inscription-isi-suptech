<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Cahier de texte" — grandes lignes de ce qui a ete enseigne par le prof,
        // saisi par seance ; visible par Admin et Accueil Pedagogique.
        Schema::create('contenus_cours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->date('date');
            $table->text('contenu');
            $table->foreignId('saisi_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['matiere_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contenus_cours');
    }
};
