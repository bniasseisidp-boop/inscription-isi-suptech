<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professeur_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code');   // "1MIN 1101"
            $table->string('nom');    // "Algorithmique 1"
            $table->unsignedSmallInteger('cm')->default(0);
            $table->unsignedSmallInteger('tp')->default(0);
            $table->unsignedSmallInteger('td')->default(0);
            $table->unsignedSmallInteger('tpe')->default(0);
            $table->unsignedSmallInteger('vht')->default(0);
            $table->decimal('coef', 4, 2)->default(1);
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matieres');
    }
};
