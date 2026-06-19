<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('doc_bac')->nullable()->after('photo');
            $table->string('doc_releve_notes')->nullable()->after('doc_bac');
            $table->string('doc_cin')->nullable()->after('doc_releve_notes');
            $table->string('doc_acte_naissance')->nullable()->after('doc_cin');
            $table->string('doc_bulletin_transfert')->nullable()->after('doc_acte_naissance');
            $table->boolean('est_transfert')->default(false)->after('doc_bulletin_transfert');
            $table->string('statut_documents')->default('en_attente')->after('est_transfert');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'doc_bac', 'doc_releve_notes', 'doc_cin',
                'doc_acte_naissance', 'doc_bulletin_transfert',
                'est_transfert', 'statut_documents',
            ]);
        });
    }
};
