<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Infos académiques
            $table->string('annee_bac')->nullable();
            $table->string('numero_pv_bac')->nullable();
            $table->string('serie_college')->nullable();
            $table->string('region_bac')->nullable();
            $table->string('dernier_diplome')->nullable();
            $table->string('annee_dernier_diplome')->nullable();
            $table->string('dernier_etablissement')->nullable();
            $table->string('numero_ine')->nullable();
            $table->text('choix_specialites')->nullable();
            $table->string('decouverte')->nullable();

            // Infos personnelles
            $table->string('civilite')->nullable();
            $table->string('numero_cni')->nullable();
            $table->date('date_delivrance_cni')->nullable();
            $table->text('notes_personnelles')->nullable();

            // Infos tuteur
            $table->string('tuteur_nom')->nullable();
            $table->string('tuteur_profession')->nullable();
            $table->string('tuteur_telephone')->nullable();
            $table->string('tuteur_email')->nullable();
            $table->string('tuteur_identite')->nullable();
            $table->string('tuteur2_nom')->nullable();
            $table->string('tuteur2_profession')->nullable();
            $table->string('tuteur2_telephone')->nullable();
            $table->string('tuteur2_email')->nullable();
            $table->boolean('surveillance_mail')->default(false);
            $table->boolean('surveillance_telephone')->default(false);

            // Autres infos
            $table->text('cursus_deux_ans')->nullable();
            $table->text('langues')->nullable();
            $table->text('logiciels')->nullable();
            $table->text('experiences')->nullable();
            $table->string('traitement_medical')->nullable();
            $table->string('allergies')->nullable();
            $table->string('vaccinations')->nullable();
            $table->string('contact_urgence1')->nullable();
            $table->string('tel_urgence1')->nullable();
            $table->string('contact_urgence2')->nullable();
            $table->string('tel_urgence2')->nullable();
            $table->string('medecin_famille')->nullable();
            $table->string('tel_medecin')->nullable();

            // Scolarité / paiement
            $table->decimal('frais_scolarite_total', 10, 2)->nullable();
            $table->decimal('avance_paiement', 10, 2)->default(0);
            $table->integer('nombre_mois_total')->nullable();
            $table->date('date_debut_paiement')->nullable();
            $table->boolean('profil_complet')->default(false);
        });
    }

    public function down(): void
    {
        // Columns dropped manually if needed
    }
};
