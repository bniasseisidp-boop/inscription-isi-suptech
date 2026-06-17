<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('filiere_id')->constrained()->onDelete('cascade');
            $table->string('nom');
            $table->string('code')->unique();
            $table->integer('duree_annees')->default(3);
            $table->decimal('frais_inscription', 10, 2)->default(0);
            $table->decimal('frais_mensuel', 10, 2)->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('filieres');
    }
};
