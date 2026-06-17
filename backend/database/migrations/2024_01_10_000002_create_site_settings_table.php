<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('cle', 100)->unique();
            $table->text('valeur')->nullable();
            $table->timestamps();
        });

        // Default settings
        $defaults = [
            'facebook'  => '',
            'instagram' => '',
            'tiktok'    => '',
            'youtube'   => '',
            'linkedin'  => '',
            'twitter'   => '',
        ];

        foreach ($defaults as $cle => $valeur) {
            DB::table('site_settings')->insert([
                'cle'        => $cle,
                'valeur'     => $valeur,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
