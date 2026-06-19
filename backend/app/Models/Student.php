<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Identity
        'user_id', 'matricule', 'nom', 'prenom', 'telephone', 'sexe',
        'date_naissance', 'lieu_naissance', 'adresse', 'nationalite', 'pays_residence',
        'photo', 'filiere_id', 'license_id', 'annee_scolaire',
        // Status
        'statut_inscription', 'date_acceptation', 'accepte_par',
        'inscription_payee', 'qr_code_path', 'notes_admin',
        // Documents
        'doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance',
        'doc_bulletin_transfert', 'est_transfert', 'statut_documents',
        // Profile — Académique
        'annee_bac', 'numero_pv_bac', 'serie_college', 'region_bac',
        'dernier_diplome', 'annee_dernier_diplome', 'dernier_etablissement',
        'numero_ine', 'choix_specialites', 'decouverte',
        // Profile — Personnel
        'civilite', 'numero_cni', 'date_delivrance_cni', 'notes_personnelles',
        // Profile — Tuteur 1
        'tuteur_nom', 'tuteur_profession', 'tuteur_telephone', 'tuteur_email', 'tuteur_identite',
        // Profile — Tuteur 2
        'tuteur2_nom', 'tuteur2_profession', 'tuteur2_telephone', 'tuteur2_email',
        // Profile — Surveillance
        'surveillance_mail', 'surveillance_telephone',
        // Profile — Autres
        'cursus_deux_ans', 'langues', 'logiciels', 'experiences',
        'traitement_medical', 'allergies', 'vaccinations',
        'contact_urgence1', 'tel_urgence1', 'contact_urgence2', 'tel_urgence2',
        'medecin_famille', 'tel_medecin',
        // Scolarité
        'frais_scolarite_total', 'avance_paiement', 'nombre_mois_total', 'date_debut_paiement',
        'profil_complet',
        // Verrouillage profil
        'profil_verrouille', 'profil_verrouille_par', 'profil_verrouille_le',
        'profil_modifie_apres_verrouillage',
    ];

    protected $casts = [
        'date_naissance'                => 'date',
        'date_acceptation'              => 'datetime',
        'date_delivrance_cni'           => 'date',
        'date_debut_paiement'           => 'date',
        'profil_verrouille_le'          => 'datetime',
        'inscription_payee'             => 'boolean',
        'profil_complet'                => 'boolean',
        'surveillance_mail'             => 'boolean',
        'surveillance_telephone'        => 'boolean',
        'est_transfert'                 => 'boolean',
        'profil_verrouille'             => 'boolean',
        'profil_modifie_apres_verrouillage' => 'boolean',
    ];

    public function getFullNameAttribute(): string
    {
        return trim(($this->prenom ?? '') . ' ' . ($this->nom ?? ''));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function license(): BelongsTo
    {
        return $this->belongsTo(License::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function cards(): HasMany
    {
        return $this->hasMany(StudentCard::class);
    }

    public function card(): HasOne
    {
        return $this->hasOne(StudentCard::class)->where('actif', true)->latestOfMany();
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(StudentNotification::class);
    }

    /** Months with unpaid mensualité up to current month */
    public function getMoisNonPayesAttribute(): array
    {
        if (!$this->inscription_payee || $this->statut_inscription !== 'accepte') {
            return [];
        }
        $license    = $this->license;
        $moisDebut  = intval($license?->mois_debut ?? 9);
        $moisFin    = intval($license?->mois_fin   ?? 6);
        $now        = \Carbon\Carbon::now();
        $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
        $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        $startDate  = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1);
        $endDate    = \Carbon\Carbon::create($anneeFin, $moisFin, 1);

        $paidMonths = $this->payments
            ->where('type', 'mensualite')
            ->where('statut', 'complete')
            ->pluck('mois')->toArray();

        $nonPayes = [];
        $cur = $startDate->copy();
        while ($cur->lte($endDate) && $cur->lte($now)) {
            $cle = $cur->format('Y-m');
            if (!in_array($cle, $paidMonths)) {
                $nonPayes[] = $cle;
            }
            $cur->addMonth();
        }
        return $nonPayes;
    }

    public static function generateMatricule(): string
    {
        $year  = date('Y');
        $count = self::withTrashed()->whereYear('created_at', $year)->count() + 1;
        return 'ISI-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
