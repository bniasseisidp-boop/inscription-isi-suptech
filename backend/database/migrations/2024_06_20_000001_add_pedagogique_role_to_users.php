<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // SQLite: reconstruct table to add 'pedagogique' to role CHECK constraint
        DB::statement('PRAGMA foreign_keys = OFF');
        DB::statement('ALTER TABLE users RENAME TO _users_role_bk');
        DB::statement("
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL DEFAULT 'student'
                    CHECK(\"role\" IN ('admin', 'student', 'cashier', 'accueil', 'pedagogique')),
                actif BOOLEAN NOT NULL DEFAULT '1',
                email_verified_at DATETIME,
                remember_token VARCHAR(100),
                created_at DATETIME,
                updated_at DATETIME
            )
        ");
        DB::statement('INSERT INTO users SELECT * FROM _users_role_bk');
        DB::statement('DROP TABLE _users_role_bk');
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');
        DB::statement('ALTER TABLE users RENAME TO _users_role_bk');
        DB::statement("
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL DEFAULT 'student'
                    CHECK(\"role\" IN ('admin', 'student', 'cashier', 'accueil')),
                actif BOOLEAN NOT NULL DEFAULT '1',
                email_verified_at DATETIME,
                remember_token VARCHAR(100),
                created_at DATETIME,
                updated_at DATETIME
            )
        ");
        DB::statement('INSERT INTO users SELECT * FROM _users_role_bk');
        DB::statement('DROP TABLE _users_role_bk');
        DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (email)');
        DB::statement('PRAGMA foreign_keys = ON');
    }
};
