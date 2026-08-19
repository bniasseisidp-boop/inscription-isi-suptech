<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dedoublonnage des rappels "cours dans 2h" envoyes aux profs — un creneau
        // recurrent (jour de semaine) ne doit declencher qu'un seul email par occurrence.
        Schema::create('rappels_cours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creneau_id')->constrained('emplois_du_temps')->cascadeOnDelete();
            $table->date('date');
            $table->timestamp('envoye_le');

            $table->unique(['creneau_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rappels_cours');
    }
};
