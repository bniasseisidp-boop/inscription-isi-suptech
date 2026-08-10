<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 'partiel' est utilisé par le code (paiement partiel d'inscription/mensualité)
        // depuis longtemps mais n'a jamais été ajouté à l'ENUM — chaque paiement partiel
        // plantait silencieusement (SQLSTATE 01000: Data truncated for column 'statut').
        DB::statement("ALTER TABLE payments MODIFY statut ENUM('en_attente', 'complete', 'echoue', 'rembourse', 'partiel', 'annule') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY statut ENUM('en_attente', 'complete', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente'");
    }
};
