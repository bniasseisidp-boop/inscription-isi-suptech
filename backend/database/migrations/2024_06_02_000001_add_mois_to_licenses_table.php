<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->tinyInteger('mois_debut')->default(9)->after('duree_annees');
            $table->tinyInteger('mois_fin')->default(6)->after('mois_debut');
        });
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropColumn(['mois_debut', 'mois_fin']);
        });
    }
};
