<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'profil_verrouille')) {
                $table->boolean('profil_verrouille')->default(false)->after('profil_complet');
            }
            if (!Schema::hasColumn('students', 'profil_verrouille_par')) {
                $table->unsignedBigInteger('profil_verrouille_par')->nullable()->after('profil_verrouille');
            }
            if (!Schema::hasColumn('students', 'profil_verrouille_le')) {
                $table->timestamp('profil_verrouille_le')->nullable()->after('profil_verrouille_par');
            }
            if (!Schema::hasColumn('students', 'profil_modifie_apres_verrouillage')) {
                $table->boolean('profil_modifie_apres_verrouillage')->default(false)->after('profil_verrouille_le');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'profil_verrouille', 'profil_verrouille_par',
                'profil_verrouille_le', 'profil_modifie_apres_verrouillage',
            ]);
        });
    }
};
