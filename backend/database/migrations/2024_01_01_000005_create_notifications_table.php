<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('student_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('titre');
            $table->text('message');
            $table->enum('type', ['info', 'success', 'warning', 'danger'])->default('info');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });

        Schema::create('student_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('numero_carte')->unique();
            $table->string('qr_code_data');
            $table->string('qr_code_image')->nullable();
            $table->string('annee_validite');
            $table->boolean('actif')->default(true);
            $table->timestamp('date_generation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_cards');
        Schema::dropIfExists('student_notifications');
    }
};
