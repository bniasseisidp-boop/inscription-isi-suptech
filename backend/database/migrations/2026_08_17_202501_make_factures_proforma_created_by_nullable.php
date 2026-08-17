<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // La contrainte d'origine bloquait (RESTRICT) la suppression d'un compte
        // staff ayant genere au moins une facture proforma — on aligne sur le
        // meme pattern que saisi_par/desactive_par/accepte_par : SET NULL.
        Schema::table('factures_proforma', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        \DB::statement('ALTER TABLE factures_proforma MODIFY created_by BIGINT UNSIGNED NULL');
        Schema::table('factures_proforma', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures_proforma', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        \DB::statement('ALTER TABLE factures_proforma MODIFY created_by BIGINT UNSIGNED NOT NULL');
        Schema::table('factures_proforma', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users');
        });
    }
};
