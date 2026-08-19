<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // module_id devient nullable : une matiere d'une filiere "calcul_simple"
        // (BT/BTS...) s'attache directement au semestre, sans UE/module.
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropForeign(['module_id']);
        });
        DB::statement('ALTER TABLE matieres MODIFY module_id BIGINT UNSIGNED NULL');
        Schema::table('matieres', function (Blueprint $table) {
            $table->foreign('module_id')->references('id')->on('modules')->cascadeOnDelete();
            $table->foreignId('semestre_id')->nullable()->after('module_id')->constrained('semestres')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropForeign(['semestre_id']);
            $table->dropColumn('semestre_id');
            $table->dropForeign(['module_id']);
        });
        DB::statement('ALTER TABLE matieres MODIFY module_id BIGINT UNSIGNED NOT NULL');
        Schema::table('matieres', function (Blueprint $table) {
            $table->foreign('module_id')->references('id')->on('modules')->cascadeOnDelete();
        });
    }
};
