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
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::statement('PRAGMA writable_schema = ON');
            \Illuminate\Support\Facades\DB::statement("
                UPDATE sqlite_master
                SET sql = REPLACE(
                    sql,
                    'check (\"statut_inscription\" in (''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))',
                    'check (\"statut_inscription\" in (''brouillon'', ''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))'
                )
                WHERE type = 'table' AND name = 'students'
            ");
            \Illuminate\Support\Facades\DB::statement('PRAGMA writable_schema = OFF');
            \Illuminate\Support\Facades\DB::statement('PRAGMA integrity_check');
        } else {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE students MODIFY statut_inscription ENUM('brouillon', 'en_attente', 'en_attente_paiement', 'accepte', 'rejete') DEFAULT 'brouillon'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::statement('PRAGMA writable_schema = ON');
            \Illuminate\Support\Facades\DB::statement("
                UPDATE sqlite_master
                SET sql = REPLACE(
                    sql,
                    'check (\"statut_inscription\" in (''brouillon'', ''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))',
                    'check (\"statut_inscription\" in (''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))'
                )
                WHERE type = 'table' AND name = 'students'
            ");
            \Illuminate\Support\Facades\DB::statement('PRAGMA writable_schema = OFF');
        } else {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE students MODIFY statut_inscription ENUM('en_attente', 'en_attente_paiement', 'accepte', 'rejete') DEFAULT 'en_attente'");
        }
    }
};
