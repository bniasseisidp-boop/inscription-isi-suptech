<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // qr_code_data stocke un JSON (avec une signature base64) qui dépasse
        // largement les 255 caractères d'un VARCHAR — la génération de carte
        // plantait systématiquement (SQLSTATE 22001: Data too long).
        DB::statement('ALTER TABLE student_cards MODIFY qr_code_data TEXT NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE student_cards MODIFY qr_code_data VARCHAR(255) NOT NULL');
    }
};
