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
        Schema::table('students', function (Blueprint $table) {
            $table->string('telephone')->nullable()->change();
            $table->enum('sexe', ['M', 'F'])->nullable()->change();
            $table->date('date_naissance')->nullable()->change();
            $table->string('lieu_naissance')->nullable()->change();
            $table->string('adresse')->nullable()->change();
            $table->string('nationalite')->nullable()->change();
            $table->string('pays_residence')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('telephone')->nullable(false)->change();
            $table->enum('sexe', ['M', 'F'])->nullable(false)->change();
            $table->date('date_naissance')->nullable(false)->change();
            $table->string('lieu_naissance')->nullable(false)->change();
            $table->string('adresse')->nullable(false)->change();
            $table->string('nationalite')->nullable(false)->change();
            $table->string('pays_residence')->nullable(false)->change();
        });
    }
};
