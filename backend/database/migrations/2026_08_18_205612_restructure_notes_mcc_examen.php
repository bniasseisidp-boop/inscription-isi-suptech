<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('mcc', 4, 2)->nullable()->after('matiere_id');    // Contrôle continu, 40%
            $table->decimal('examen', 4, 2)->nullable()->after('mcc');       // Examen, 60%
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('note');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('note', 4, 2)->nullable();
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['mcc', 'examen']);
        });
    }
};
