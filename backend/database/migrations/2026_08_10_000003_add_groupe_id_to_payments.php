<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Identifie les paiements créés ensemble lors d'un versement anticipé
            // multi-mois, pour pouvoir générer un seul reçu consolidé.
            $table->string('groupe_id')->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('groupe_id');
        });
    }
};
