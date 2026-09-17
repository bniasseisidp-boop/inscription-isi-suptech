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
        'photo', 'filiere_id', 'license_id', 'niveau_entree', 'annee_scolaire',
        'type_inscription', 'nature_bourse',
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

    public function notes()
    {
        return $this->hasMany(Note::class);
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

    /**
     * Clé Y-m du dernier mois de l'année scolaire pour cet étudiant — ce mois est
     * déjà réglé via les frais d'inscription (cf. PDFService::generateReceipt) et ne doit
     * jamais faire l'objet d'un paiement de mensualité séparé.
     */
    public function getDernierMoisCleAttribute(): ?string
    {
        $license = $this->license;
        if (!$license) return null;

        $moisFin     = intval($license->mois_fin   ?? 6);
        $moisDebut   = intval($license->mois_debut ?? 9);
        $now         = \Carbon\Carbon::now();
        if ($this->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
            $anneeFin   = (int) $m[2];
        } else {
            $anneeDebut  = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin    = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        }
        $anneeFinOff = ($moisFin < $moisDebut) ? ($anneeFin - $anneeDebut) : 0;
        return sprintf('%04d-%02d', $anneeDebut + $anneeFinOff, $moisFin);
    }

    /**
     * Liste normalisée des clés Y-m des mensualités payées par l'étudiant
     */
    public function getMoisPayesCleAttribute(): array
    {
        $license    = $this->license;
        $moisDebut  = intval($license?->mois_debut ?? 9);
        $moisFin    = intval($license?->mois_fin   ?? 6);

        if ($this->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
            $anneeFin   = (int) $m[2];
        } else {
            $now = \Carbon\Carbon::now();
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        }

        $frenchMonths = [
            'janvier' => 1, 'fevrier' => 2, 'février' => 2, 'mars' => 3, 'avril' => 4,
            'mai' => 5, 'juin' => 6, 'juillet' => 7, 'aout' => 8, 'août' => 8,
            'septembre' => 9, 'octobre' => 10, 'novembre' => 11, 'decembre' => 12, 'décembre' => 12,
        ];

        $paidKeys = [];
        foreach ($this->payments as $p) {
            if ($p->statut !== 'complete' && $p->statut !== 'partiel') continue;
            $raw = trim($p->mois ?? '');
            if (!$raw) continue;

            if (preg_match('/^\d{4}-\d{2}$/', $raw)) {
                $paidKeys[] = $raw;
                continue;
            }

            if (preg_match('/(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)/iu', $raw, $mat)) {
                $monthWord = mb_strtolower($mat[1], 'UTF-8');
                $mNum = $frenchMonths[$monthWord] ?? null;
                if ($mNum !== null) {
                    $y = ($mNum >= $moisDebut) ? $anneeDebut : $anneeFin;
                    $paidKeys[] = sprintf('%04d-%02d', $y, $mNum);
                }
            }
        }
        return array_values(array_unique($paidKeys));
    }

    /** Months with unpaid mensualité up to current month (dernier mois exclu — déjà réglé via l'inscription) */
    public function getMoisNonPayesAttribute(): array
    {
        // Si l'étudiant est déjà en règle ou n'a aucun solde restant dû
        $solde = floatval($this->compta_solde_restant ?? 0);
        $debit = floatval($this->compta_debit_total ?? 0);
        $paye = floatval($this->compta_total_paye ?? 0);
        $enRegle = (bool)($this->compta_est_en_regle ?? false);

        if ($enRegle || ($debit > 0 && $solde <= 0) || ($paye >= $debit && $debit > 0)) {
            return [];
        }

        if (!$this->inscription_payee || $this->statut_inscription !== 'accepte') {
            return [];
        }
        $license    = $this->license;
        $moisDebut  = intval($license?->mois_debut ?? 9);
        $moisFin    = intval($license?->mois_fin   ?? 6);
        $fraisMensuel = floatval($license?->frais_mensuel ?? 50000);
        $now        = \Carbon\Carbon::now();

        if ($this->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
            $anneeFin   = (int) $m[2];
        } else {
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        }

        $startDate  = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1);
        $endDate    = \Carbon\Carbon::create($anneeFin, $moisFin, 1)->subMonth();
        $dernierMoisCle = sprintf('%04d-%02d', $anneeFin, $moisFin);

        // Pour les années scolaires passées, le cycle complet s'arrête à endDate.
        // Pour l'année en cours, il s'arrête au mois actuel ou à endDate.
        $isPastYear = ($anneeFin < $now->year) || ($anneeFin == $now->year && $now->month > $moisFin);
        $limitDate = $isPastYear ? $endDate : $now->copy()->min($endDate);

        $cycleMonths = [];
        $cur = $startDate->copy();
        while ($cur->lte($limitDate)) {
            $cle = $cur->format('Y-m');
            if ($cle !== $dernierMoisCle) {
                $cycleMonths[] = $cle;
            }
            $cur->addMonth();
        }

        // Total des mensualités payées
        $totalMensualitesPayees = $this->payments
            ->where('type', 'mensualite')
            ->whereIn('statut', ['complete', 'partiel'])
            ->sum('montant');

        $fraisScolariteTotal = floatval($this->frais_scolarite_total ?? 0);
        $allFraisTotal = $fraisScolariteTotal > 0 ? $fraisScolariteTotal : (count($cycleMonths) * $fraisMensuel);

        // Si la scolarité totale est payée, aucun mois impayé
        if ($allFraisTotal > 0 && $totalMensualitesPayees >= $allFraisTotal) {
            return [];
        }

        $paidKeys = $this->mois_payes_cle;
        $monthsCoveredByAmount = $fraisMensuel > 0 ? intval(floor($totalMensualitesPayees / $fraisMensuel)) : 0;

        $nonPayes = [];
        $coveredCount = 0;
        foreach ($cycleMonths as $cle) {
            if (in_array($cle, $paidKeys, true)) {
                $coveredCount++;
                continue;
            }
            if ($coveredCount < $monthsCoveredByAmount) {
                $coveredCount++;
                continue;
            }
            $nonPayes[] = $cle;
        }

        return $nonPayes;
    }

    /**
     * Vérifie qu'un mois donné peut faire l'objet d'un nouveau paiement de mensualité.
     * Retourne null si c'est payable, sinon un message d'erreur explicite.
     */
    /** @param array $moisSupposesPayes Mois du même lot (paiement multi-mois) déjà validés
     *  avant celui-ci — à traiter comme réglés pour ne pas se bloquer soi-même. */
    public function moisEstPayable(string $moisCle, array $moisSupposesPayes = []): ?string
    {
        if (!$this->inscription_payee || $this->statut_inscription !== 'accepte') {
            return "L'inscription doit être réglée avant de payer une mensualité.";
        }
        $license = $this->license;
        if (!$license) {
            return "Aucune formation associée à cet étudiant.";
        }

        $moisDebut  = intval($license->mois_debut ?? 9);
        $moisFin    = intval($license->mois_fin   ?? 6);
        $now        = \Carbon\Carbon::now();
        if ($this->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
            $anneeFin   = (int) $m[2];
        } else {
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        }
        $startCle   = sprintf('%04d-%02d', $anneeDebut, $moisDebut);
        $dernierMoisCle = sprintf('%04d-%02d', $anneeFin, $moisFin);

        if ($moisCle < $startCle || ($dernierMoisCle && $moisCle >= $dernierMoisCle)) {
            if ($dernierMoisCle && $moisCle === $dernierMoisCle) {
                return "Ce mois est déjà inclus dans les frais d'inscription.";
            }
            return "Ce mois ne fait pas partie de l'année scolaire en cours — impossible de le payer.";
        }

        $paidKeys = $this->mois_payes_cle;
        if (in_array($moisCle, $paidKeys, true)) {
            return "Ce mois a déjà été payé — impossible de payer deux fois le même mois.";
        }

        // Vérifier l'ordre chronologique des paiements
        $cur = \Carbon\Carbon::createFromFormat('Y-m-d', $startCle . '-01');
        $premierNonPaye = null;
        while ($cur->format('Y-m') < $dernierMoisCle) {
            $cle = $cur->format('Y-m');
            if (!in_array($cle, $paidKeys, true) && !in_array($cle, $moisSupposesPayes, true)) {
                $premierNonPaye = $cle;
                break;
            }
            $cur->addMonth();
        }
        if ($premierNonPaye && $moisCle > $premierNonPaye) {
            return "Le mois {$premierNonPaye} n'est pas encore réglé — il doit être payé avant {$moisCle}.";
        }

        return null;
    }

    /** Etudiant "en regle" avec la comptabilite (inscription payee + aucune mensualite en retard)
     *  — condition requise pour generer son bulletin officiel. */
    public function estEnRegle(): bool
    {
        $solde = floatval($this->compta_solde_restant ?? 0);
        $debit = floatval($this->compta_debit_total ?? 0);
        $paye = floatval($this->compta_total_paye ?? 0);
        $enRegle = (bool)($this->compta_est_en_regle ?? false);

        if ($enRegle || ($debit > 0 && $solde <= 0) || ($paye >= $debit && $debit > 0)) {
            return true;
        }

        return (bool) $this->inscription_payee && empty($this->mois_non_payes);
    }


    public static function generateMatricule(): string
    {
        $prefix = 'ISI-' . date('Y') . '-';

        $maxSuffix = self::withTrashed()
            ->where('matricule', 'like', $prefix . '%')
            ->pluck('matricule')
            ->map(fn ($m) => (int) substr($m, strlen($prefix)))
            ->max() ?? 0;

        $next = $maxSuffix + 1;
        $matricule = $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);

        // Garde-fou contre une collision improbable (deux creations simultanees).
        while (self::withTrashed()->where('matricule', $matricule)->exists()) {
            $next++;
            $matricule = $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
        }

        return $matricule;
    }

    /** Champs "nom de personne / lieu" — normalisés en Title Case à chaque sauvegarde,
     *  quelle que soit la casse saisie par le candidat (tout minuscule, tout majuscule...). */
    private const CHAMPS_A_CAPITALISER = [
        'nom', 'prenom', 'lieu_naissance', 'adresse', 'dernier_etablissement',
        'tuteur_nom', 'tuteur2_nom', 'contact_urgence1', 'contact_urgence2', 'medecin_famille',
    ];

    protected static function booted(): void
    {
        static::saving(function (Student $student) {
            foreach (self::CHAMPS_A_CAPITALISER as $champ) {
                if (!empty($student->{$champ}) && is_string($student->{$champ})) {
                    $student->{$champ} = self::capitaliserNomPropre($student->{$champ});
                }
            }
        });
    }

    /** Majuscule en début de mot (et après espace / tiret / apostrophe, pour "N'Diaye",
     *  "El-Hadji", etc.), reste en minuscule — indépendant de la casse saisie par l'utilisateur. */
    public static function capitaliserNomPropre(string $valeur): string
    {
        $valeur = mb_strtolower(trim($valeur), 'UTF-8');
        return preg_replace_callback(
            "/(^|[\s\-'])(\p{L})/u",
            fn ($m) => $m[1] . mb_strtoupper($m[2], 'UTF-8'),
            $valeur
        );
    }
}
