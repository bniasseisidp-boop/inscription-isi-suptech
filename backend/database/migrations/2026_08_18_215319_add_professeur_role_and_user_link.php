<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','super_admin','student','cashier','accueil','pedagogique','professeur') NOT NULL DEFAULT 'student'");

        Schema::table('professeurs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('professeurs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });

        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','super_admin','student','cashier','accueil','pedagogique') NOT NULL DEFAULT 'student'");
    }
};
