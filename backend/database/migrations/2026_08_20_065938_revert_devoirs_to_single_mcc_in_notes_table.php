<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Retour a un seul champ de devoir (40%) + examen (60%) — le systeme a 2 devoirs
        // moyennes s'est avere plus complique que necessaire pour l'usage reel.
        DB::statement('ALTER TABLE notes CHANGE devoir1 mcc DECIMAL(4,2) NULL');

        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('devoir2');
        });
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE notes CHANGE mcc devoir1 DECIMAL(4,2) NULL');

        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('devoir2', 4, 2)->nullable()->after('devoir1');
        });
    }
};
