<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            // SQLite doesn't support ALTER TABLE for constraints.
            // We patch the schema definition directly.
            DB::statement('PRAGMA writable_schema = ON');

            DB::statement("
                UPDATE sqlite_master
                SET sql = REPLACE(
                    sql,
                    'check (\"statut_inscription\" in (''en_attente'', ''accepte'', ''rejete''))',
                    'check (\"statut_inscription\" in (''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))'
                )
                WHERE type = 'table' AND name = 'students'
            ");

            DB::statement('PRAGMA writable_schema = OFF');
            DB::statement('PRAGMA integrity_check');
            return;
        }

        DB::statement("ALTER TABLE students MODIFY statut_inscription ENUM('en_attente', 'en_attente_paiement', 'accepte', 'rejete') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA writable_schema = ON');
            DB::statement("
                UPDATE sqlite_master
                SET sql = REPLACE(
                    sql,
                    'check (\"statut_inscription\" in (''en_attente'', ''en_attente_paiement'', ''accepte'', ''rejete''))',
                    'check (\"statut_inscription\" in (''en_attente'', ''accepte'', ''rejete''))'
                )
                WHERE type = 'table' AND name = 'students'
            ");
            DB::statement('PRAGMA writable_schema = OFF');
            return;
        }

        DB::statement("ALTER TABLE students MODIFY statut_inscription ENUM('en_attente', 'accepte', 'rejete') NOT NULL DEFAULT 'en_attente'");
    }
};
