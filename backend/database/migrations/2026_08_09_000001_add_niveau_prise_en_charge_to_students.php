<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Année d'entrée dans le programme choisi (1ère année, 2ème année, 3ème année, M1, M2…)
            // — utile car un même niveau (ex: DTS-BTS-Licence) peut être rejoint directement en 2e ou 3e année.
            $table->string('niveau_entree')->nullable()->after('license_id');
            // Prise en charge (affiché sur la fiche d'inscription)
            $table->string('type_inscription')->nullable()->after('niveau_entree');
            $table->string('nature_bourse')->nullable()->after('type_inscription');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['niveau_entree', 'type_inscription', 'nature_bourse']);
        });
    }
};
