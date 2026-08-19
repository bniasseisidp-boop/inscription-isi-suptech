<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            // Filieres hors Licence/Master (BT, BTS, etc.) : notes calculees a plat
            // (Moy Cont + Compo)/2 par matiere, sans regroupement en UE/modules ni
            // validation par credits — juste une moyenne ponderee par coef.
            $table->boolean('calcul_simple')->default(false)->after('actif');
        });
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropColumn('calcul_simple');
        });
    }
};
