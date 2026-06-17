<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['inscription', 'mensualite', 'autre'])->default('mensualite');
            $table->decimal('montant', 10, 2);
            $table->string('mois')->nullable();
            $table->string('annee')->nullable();
            $table->string('wave_checkout_id')->nullable()->unique();
            $table->string('wave_session_id')->nullable();
            $table->string('wave_transaction_id')->nullable();
            $table->enum('statut', ['en_attente', 'complete', 'echoue', 'rembourse'])->default('en_attente');
            $table->timestamp('date_paiement')->nullable();
            $table->string('methode')->default('wave');
            $table->string('recu_pdf_path')->nullable();
            $table->boolean('recu_email_envoye')->default(false);
            $table->foreignId('saisi_par')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
