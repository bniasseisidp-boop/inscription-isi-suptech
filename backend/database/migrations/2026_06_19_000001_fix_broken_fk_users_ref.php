<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Cette migration ne corrige qu'un historique SQLite (FK cassées après
        // suppression de _users_role_bk) — sans objet sur MySQL, où les FK des
        // migrations d'origine sont déjà correctes.
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        // ── Fix students table: FK refs point to _users_role_bk (dropped) ──
        DB::statement('ALTER TABLE students RENAME TO _students_fk_bk');

        DB::statement('CREATE TABLE "students" (
            "id" integer primary key autoincrement not null,
            "user_id" integer not null,
            "matricule" varchar,
            "nom" varchar not null,
            "prenom" varchar not null,
            "telephone" varchar not null,
            "sexe" varchar check ("sexe" in (\'M\', \'F\')) not null,
            "date_naissance" date not null,
            "lieu_naissance" varchar not null,
            "adresse" varchar not null,
            "nationalite" varchar not null,
            "pays_residence" varchar not null,
            "photo" varchar,
            "filiere_id" integer,
            "license_id" integer,
            "annee_scolaire" varchar,
            "statut_inscription" varchar check ("statut_inscription" in (\'en_attente\', \'en_attente_paiement\', \'accepte\', \'rejete\')) not null default \'en_attente\',
            "date_acceptation" datetime,
            "accepte_par" integer,
            "inscription_payee" tinyint(1) not null default \'0\',
            "qr_code_path" varchar,
            "notes_admin" text,
            "created_at" datetime,
            "updated_at" datetime,
            "annee_bac" varchar,
            "numero_pv_bac" varchar,
            "serie_college" varchar,
            "region_bac" varchar,
            "dernier_diplome" varchar,
            "annee_dernier_diplome" varchar,
            "dernier_etablissement" varchar,
            "numero_ine" varchar,
            "choix_specialites" text,
            "decouverte" varchar,
            "civilite" varchar,
            "numero_cni" varchar,
            "date_delivrance_cni" date,
            "notes_personnelles" text,
            "tuteur_nom" varchar,
            "tuteur_profession" varchar,
            "tuteur_telephone" varchar,
            "tuteur_email" varchar,
            "tuteur_identite" varchar,
            "tuteur2_nom" varchar,
            "tuteur2_profession" varchar,
            "tuteur2_telephone" varchar,
            "tuteur2_email" varchar,
            "surveillance_mail" tinyint(1) not null default \'0\',
            "surveillance_telephone" tinyint(1) not null default \'0\',
            "cursus_deux_ans" text,
            "langues" text,
            "logiciels" text,
            "experiences" text,
            "traitement_medical" varchar,
            "allergies" varchar,
            "vaccinations" varchar,
            "contact_urgence1" varchar,
            "tel_urgence1" varchar,
            "contact_urgence2" varchar,
            "tel_urgence2" varchar,
            "medecin_famille" varchar,
            "tel_medecin" varchar,
            "frais_scolarite_total" numeric,
            "avance_paiement" numeric not null default \'0\',
            "nombre_mois_total" integer,
            "date_debut_paiement" date,
            "profil_complet" tinyint(1) not null default \'0\',
            "doc_bac" varchar,
            "doc_releve_notes" varchar,
            "doc_cin" varchar,
            "doc_acte_naissance" varchar,
            "doc_bulletin_transfert" varchar,
            "est_transfert" tinyint(1) not null default \'0\',
            "statut_documents" varchar not null default \'en_attente\',
            "deleted_at" datetime,
            "profil_verrouille" tinyint(1) not null default \'0\',
            "profil_verrouille_par" integer,
            "profil_verrouille_le" datetime,
            "profil_modifie_apres_verrouillage" tinyint(1) not null default \'0\',
            foreign key("user_id") references "users"("id") on delete cascade,
            foreign key("filiere_id") references "filieres"("id") on delete set null,
            foreign key("license_id") references "licenses"("id") on delete set null,
            foreign key("accepte_par") references "users"("id") on delete set null
        )');

        DB::statement('INSERT INTO students SELECT * FROM _students_fk_bk');
        DB::statement('DROP TABLE _students_fk_bk');
        DB::statement('CREATE UNIQUE INDEX "students_matricule_unique" ON students ("matricule")');

        // ── Fix payments table: saisi_par FK refs _users_role_bk ──
        DB::statement('ALTER TABLE payments RENAME TO _payments_fk_bk');

        DB::statement('CREATE TABLE "payments" (
            "id" integer primary key autoincrement not null,
            "student_id" integer not null,
            "type" varchar check ("type" in (\'inscription\', \'mensualite\', \'autre\')) not null default \'mensualite\',
            "montant" numeric not null,
            "mois" varchar,
            "annee" varchar,
            "wave_checkout_id" varchar,
            "wave_session_id" varchar,
            "wave_transaction_id" varchar,
            "statut" varchar check ("statut" in (\'en_attente\', \'complete\', \'echoue\', \'rembourse\', \'partiel\', \'annule\')) not null default \'en_attente\',
            "date_paiement" datetime,
            "methode" varchar not null default \'wave\',
            "recu_pdf_path" varchar,
            "recu_email_envoye" tinyint(1) not null default \'0\',
            "saisi_par" integer,
            "notes" text,
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("student_id") references "students"("id") on delete cascade,
            foreign key("saisi_par") references "users"("id") on delete set null
        )');

        DB::statement('INSERT INTO payments SELECT * FROM _payments_fk_bk');
        DB::statement('DROP TABLE _payments_fk_bk');
        DB::statement('CREATE UNIQUE INDEX "payments_wave_checkout_id_unique" ON payments ("wave_checkout_id")');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        // Irreversible — restoring broken FK references is undesirable
    }
};
