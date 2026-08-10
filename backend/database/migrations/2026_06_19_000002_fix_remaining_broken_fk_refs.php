<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Cette migration ne corrige qu'un historique SQLite (FK cassées après
        // suppression de _students_fk_bk / _users_role_bk) — sans objet sur MySQL.
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        // ── Fix student_notifications: FK refs _students_fk_bk ──
        DB::statement('ALTER TABLE student_notifications RENAME TO _sn_fk_bk');
        DB::statement('CREATE TABLE "student_notifications" (
            "id" integer primary key autoincrement not null,
            "student_id" integer not null,
            "titre" varchar not null,
            "message" text not null,
            "type" varchar check ("type" in (\'info\', \'success\', \'warning\', \'danger\')) not null default \'info\',
            "lu" tinyint(1) not null default \'0\',
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("student_id") references "students"("id") on delete cascade
        )');
        DB::statement('INSERT INTO student_notifications SELECT * FROM _sn_fk_bk');
        DB::statement('DROP TABLE _sn_fk_bk');

        // ── Fix student_cards: FK refs _students_fk_bk ──
        DB::statement('ALTER TABLE student_cards RENAME TO _sc_fk_bk');
        DB::statement('CREATE TABLE "student_cards" (
            "id" integer primary key autoincrement not null,
            "student_id" integer not null,
            "numero_carte" varchar not null,
            "qr_code_data" varchar not null,
            "qr_code_image" varchar,
            "annee_validite" varchar not null,
            "actif" tinyint(1) not null default \'1\',
            "date_generation" datetime not null,
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("student_id") references "students"("id") on delete cascade
        )');
        DB::statement('INSERT INTO student_cards SELECT * FROM _sc_fk_bk');
        DB::statement('DROP TABLE _sc_fk_bk');
        DB::statement('CREATE UNIQUE INDEX "student_cards_numero_carte_unique" ON student_cards ("numero_carte")');

        // ── Fix mois_desactives: FK refs _users_role_bk ──
        DB::statement('ALTER TABLE mois_desactives RENAME TO _md_fk_bk');
        DB::statement('CREATE TABLE "mois_desactives" (
            "id" integer primary key autoincrement not null,
            "mois" varchar not null,
            "raison" varchar,
            "desactive_par" integer,
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("desactive_par") references "users"("id") on delete set null
        )');
        DB::statement('INSERT INTO mois_desactives SELECT * FROM _md_fk_bk');
        DB::statement('DROP TABLE _md_fk_bk');
        DB::statement('CREATE UNIQUE INDEX "mois_desactives_mois_unique" ON mois_desactives ("mois")');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void {}
};
