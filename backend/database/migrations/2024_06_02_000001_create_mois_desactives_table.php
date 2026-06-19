<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mois_desactives', function (Blueprint $table) {
            $table->id();
            $table->string('mois', 7)->unique(); // ex: 2024-10
            $table->string('raison')->nullable();
            $table->unsignedBigInteger('desactive_par')->nullable();
            $table->foreign('desactive_par')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });

        // Add missing soft-delete column to students if not present
        if (!Schema::hasColumn('students', 'deleted_at')) {
            Schema::table('students', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add en_attente_paiement status tracking & saisi_par on payments
        if (!Schema::hasColumn('payments', 'saisi_par')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->unsignedBigInteger('saisi_par')->nullable()->after('notes');
                $table->foreign('saisi_par')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mois_desactives');
    }
};
