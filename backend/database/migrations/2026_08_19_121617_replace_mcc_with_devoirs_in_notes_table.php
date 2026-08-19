<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('devoir1', 4, 2)->nullable()->after('matiere_id');
            $table->decimal('devoir2', 4, 2)->nullable()->after('devoir1');
        });

        // Les MCC deja saisies deviennent le premier des deux devoirs — aucune note perdue.
        DB::statement('UPDATE notes SET devoir1 = mcc WHERE mcc IS NOT NULL');

        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('mcc');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('mcc', 4, 2)->nullable()->after('matiere_id');
        });

        DB::statement('UPDATE notes SET mcc = devoir1');

        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['devoir1', 'devoir2']);
        });
    }
};
