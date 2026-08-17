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
        Schema::create('factures_proforma', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('entreprise');
            $table->string('beneficiaire');
            $table->foreignId('license_id')->constrained();
            $table->decimal('montant_total', 12, 2);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures_proforma');
    }
};
