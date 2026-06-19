<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    protected $fillable = [
        'user_id', 'matricule', 'nom', 'prenom', 'telephone', 'sexe',
        'date_naissance', 'lieu_naissance', 'adresse', 'nationalite',
        'pays_residence', 'photo', 'filiere_id', 'license_id',
        'annee_scolaire', 'statut_inscription', 'date_acceptation',
        'accepte_par', 'inscription_payee', 'qr_code_path', 'notes_admin',
        'doc_bac', 'doc_releve_notes', 'doc_cin', 'doc_acte_naissance',
        'doc_bulletin_transfert', 'est_transfert', 'statut_documents',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_acceptation' => 'datetime',
        'inscription_payee' => 'boolean',
    ];

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
        return $this->hasOne(StudentCard::class)->where('actif', true)->latest();
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(StudentNotification::class);
    }

    public function getMoisNonPayesAttribute(): array
    {
        $moisPaies = $this->payments()
            ->where('type', 'mensualite')
            ->where('statut', 'complete')
            ->pluck('mois')
            ->toArray();

        $moisActuel = now()->format('Y-m');
        $moisDebut = $this->date_acceptation
            ? $this->date_acceptation->format('Y-m')
            : now()->format('Y-m');

        $moisNonPaies = [];
        $current = \Carbon\Carbon::parse($moisDebut . '-01');
        $end = \Carbon\Carbon::parse($moisActuel . '-01');

        while ($current->lte($end)) {
            $mois = $current->format('Y-m');
            if (!in_array($mois, $moisPaies)) {
                $moisNonPaies[] = $mois;
            }
            $current->addMonth();
        }

        return $moisNonPaies;
    }

    public function getFullNameAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public static function generateMatricule(): string
    {
        $year = date('Y');
        $count = self::whereYear('created_at', $year)->count() + 1;
        return 'ISI-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
