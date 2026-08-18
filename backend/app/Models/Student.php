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
     * Clé Y-m du dernier mois de l'année scolaire en cours pour ce licence — ce mois est
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
        $anneeDebut  = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
        $anneeFinOff = ($moisFin < $moisDebut) ? 1 : 0;
        $tentativeEnd = \Carbon\Carbon::create($anneeDebut + $anneeFinOff, $moisFin, 1)->endOfMonth();
        if ($tentativeEnd->lt($now)) {
            $anneeDebut++;
        }
        return ($anneeDebut + $anneeFinOff) . '-' . str_pad($moisFin, 2, '0', STR_PAD_LEFT);
    }

    /** Months with unpaid mensualité up to current month (dernier mois exclu — déjà réglé via l'inscription) */
    public function getMoisNonPayesAttribute(): array
    {
        if (!$this->inscription_payee || $this->statut_inscription !== 'accepte') {
            return [];
        }
        $license    = $this->license;
        $moisDebut  = intval($license?->mois_debut ?? 9);
        $moisFin    = intval($license?->mois_fin   ?? 6);
        $now        = \Carbon\Carbon::now();
        // Priorité à l'année scolaire réelle de l'étudiant (ex. "2026-2027") : sinon, avant
        // le mois de rentrée, le calcul par défaut retombe sur le cycle précédent et AUCUN
        // mois du cycle en cours ne correspond plus — tout apparaît comme impayé alors que
        // l'étudiant est à jour (cf. receipt.blade.php, même bug corrigé là-bas).
        if ($this->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
            $anneeFin   = (int) $m[2];
        } else {
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
            $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
        }
        $startDate  = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1);
        $endDate    = \Carbon\Carbon::create($anneeFin, $moisFin, 1)->subMonth();
        $dernierMoisCle = $this->dernier_mois_cle;

        // Toute mensualité déjà saisie (complète ou partielle) verrouille son mois —
        // un déficit se reporte sur le mois suivant, pas sur un 2e paiement du même mois.
        $paidMonths = $this->payments
            ->where('type', 'mensualite')
            ->pluck('mois')->toArray();

        $nonPayes = [];
        $cur = $startDate->copy();
        while ($cur->lte($endDate) && $cur->lte($now)) {
            $cle = $cur->format('Y-m');
            if ($cle !== $dernierMoisCle && !in_array($cle, $paidMonths)) {
                $nonPayes[] = $cle;
            }
            $cur->addMonth();
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
        if ($this->annee_scolaire && preg_match('/^(\d{4})-\d{4}$/', $this->annee_scolaire, $m)) {
            $anneeDebut = (int) $m[1];
        } else {
            $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
        }
        $startCle   = sprintf('%04d-%02d', $anneeDebut, $moisDebut);
        $dernierMoisCle = $this->dernier_mois_cle;

        if ($moisCle < $startCle || ($dernierMoisCle && $moisCle >= $dernierMoisCle)) {
            if ($dernierMoisCle && $moisCle === $dernierMoisCle) {
                return "Ce mois est déjà inclus dans les frais d'inscription.";
            }
            return "Ce mois ne fait pas partie de l'année scolaire en cours — impossible de le payer.";
        }

        $dejaPaye = $this->payments()->where('type', 'mensualite')->where('mois', $moisCle)->exists();
        if ($dejaPaye) {
            return "Ce mois a déjà été payé — impossible de payer deux fois le même mois.";
        }

        // Interdit de sauter un mois impayé plus ancien pour payer un mois plus récent —
        // même en paiement anticipé (le mois pas encore "arrivé" dans le calendrier réel
        // n'est pas dans mois_non_payes, qui s'arrête à aujourd'hui : on doit donc rebalayer
        // tout le cycle sept-juin, pas seulement jusqu'à maintenant). Le premier mois encore
        // dû (hors ceux déjà validés dans ce même lot multi-mois) doit toujours être réglé
        // avant tout mois qui le suit.
        $paidMonths = $this->payments->where('type', 'mensualite')->pluck('mois')->toArray();
        $premierNonPaye = null;
        $cur = \Carbon\Carbon::createFromFormat('Y-m-d', $startCle . '-01');
        while ($cur->format('Y-m') < $dernierMoisCle) {
            $cle = $cur->format('Y-m');
            if (!in_array($cle, $paidMonths, true) && !in_array($cle, $moisSupposesPayes, true)) {
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

    public static function generateMatricule(): string
    {
        $year  = date('Y');
        $count = self::withTrashed()->whereYear('created_at', $year)->count() + 1;
        return 'ISI-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
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
