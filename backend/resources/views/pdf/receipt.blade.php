@php
/* ── Variables calculées ─────────────────────────────────────────── */
$moisNoms = ['01'=>'Janvier','02'=>'Février','03'=>'Mars','04'=>'Avril','05'=>'Mai',
             '06'=>'Juin','07'=>'Juillet','08'=>'Août','09'=>'Septembre',
             '10'=>'Octobre','11'=>'Novembre','12'=>'Décembre'];
$moisCourts = ['01'=>'Janvier','02'=>'Février','03'=>'Mars','04'=>'Avril','05'=>'Mai','06'=>'Juin',
               '07'=>'Juillet','08'=>'Août','09'=>'Septembre','10'=>'Octobre','11'=>'Novembre','12'=>'Décembre'];

// Titre "À titre de"
if ($payment->mois) {
    $numMoisPmt = substr($payment->mois, 5, 2);
    $titreLabel  = $moisNoms[$numMoisPmt] ?? $payment->mois;
} elseif ($payment->type === 'inscription') {
    $titreLabel = "Frais d'inscription";
} else {
    $titreLabel = '—';
}

// Paiement anticipé multi-mois (même groupe_id) : le titre liste tous les mois
// couverts par ce versement, avec la mention "(partiel, reste X)" sur celui qui
// n'est pas entièrement soldé — sans changer la mise en page du reçu.
$moisGroupeLabels = [];
if ($groupePayments->count() > 1) {
    foreach ($groupePayments->sortBy('mois') as $gp) {
        if (!$gp->mois) continue;
        $lbl = $moisNoms[substr($gp->mois, 5, 2)] ?? $gp->mois;
        if ($gp->statut === 'partiel') {
            $reste = max(0, floatval($fraisMensuel) - floatval($gp->montant));
            $lbl  .= ' (' . number_format(floatval($gp->montant), 0, ',', ' ') . ' versé, reste ' . number_format($reste, 0, ',', ' ') . ')';
        } else {
            $lbl  .= ' (payé)';
        }
        $moisGroupeLabels[] = $lbl;
    }
    $titreLabel = implode(' + ', $moisGroupeLabels);
}

// Année scolaire — dérivée en priorité de l'année scolaire réelle de l'étudiant
// (ex. "2026-2027"), PAS de la date du jour : sinon, avant le mois de rentrée
// (septembre), le calcul retombe sur le cycle de l'année précédente et la grille
// ne contient plus du tout les mois du cycle en cours (ils "disparaissent" et
// s'affichent tous au plein tarif, sans aucun mois marqué payé).
$moisDebut  = intval($student->license?->mois_debut ?? 9);
$moisFin    = intval($student->license?->mois_fin   ?? 6);
if ($student->annee_scolaire && preg_match('/^(\d{4})-(\d{4})$/', $student->annee_scolaire, $m)) {
    $anneeDebut = (int) $m[1];
    $anneeFin   = (int) $m[2];
} else {
    $now        = \Carbon\Carbon::now();
    $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
    $anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
}
$anneeScolaireLabel = $student->annee_scolaire ?? ($anneeDebut . '-' . $anneeFin);

// Mois payés / restants
$payesKeys = collect($moisPayesList)->pluck('cle')->toArray();
$calMois = [];
$cur     = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1);
$endCal  = \Carbon\Carbon::create($anneeFin, $moisFin, 1);
while ($cur->lte($endCal)) {
    $calMois[] = ['cle' => $cur->format('Y-m'), 'label' => $moisCourts[$cur->format('m')] ?? $cur->format('m')];
    $cur->addMonth();
}
$deficitsParMois = collect($deficits)->keyBy('mois');

// Solde reporté (avance_paiement) : négatif = déficit à rattraper, positif = crédit
// d'avance. Il se répercute sur le mois qui suit directement le dernier mois réglé
// (payé ou partiel) — pas sur le premier mois non payé du calendrier, qui peut être un
// mois antérieur resté en attente sans lien avec ce déficit (paiement anticipé "sauté").
$soldeReporte     = round(floatval($avancePaiement ?? 0), 2);
$premierMoisNonPaye = null;
$dernierMoisPayeCle = collect($payesKeys)->sort()->last();
if ($dernierMoisPayeCle) {
    $idxDernierPaye = collect($calMois)->search(fn ($m) => $m['cle'] === $dernierMoisPayeCle);
    if ($idxDernierPaye !== false && isset($calMois[$idxDernierPaye + 1])
        && $calMois[$idxDernierPaye + 1]['cle'] !== $dernierMoisCle) {
        $premierMoisNonPaye = $calMois[$idxDernierPaye + 1]['cle'];
    }
} else {
    foreach ($calMois as $m) {
        if (!in_array($m['cle'], $payesKeys) && $m['cle'] !== $dernierMoisCle) {
            $premierMoisNonPaye = $m['cle'];
            break;
        }
    }
}

// Codes de référence (dérivés, purement d'affichage)
$anneeCourte  = substr((string) $anneeFin, -2);
$licCode      = $student->license?->code ?? 'ISI';
$numInscription = $licCode . '-' . $anneeCourte . '-' . str_pad($student->id, 4, '0', STR_PAD_LEFT);
$refBordereau = 'ISI-' . str_pad($payment->id, 5, '0', STR_PAD_LEFT) . '/ISI SUPTECH';
$refPiece = $student->numero_cni ?? $student->matricule ?? '—';
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:9px; color:#1a1a2e; background:#fff; padding:16px 20px 10px; }

/* HEADER */
.hd-table { width:100%; border-collapse:collapse; }
.hd-logo-cell { width:70px; vertical-align:middle; }
.hd-logo-cell img { width:58px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell h2 { font-size:13px; font-weight:900; color:#1a1a2e; font-family:'DejaVu Serif',serif; }
.hd-center-cell p  { font-size:7.5px; color:#475569; font-style:italic; margin-top:2px; }
.hd-right-cell { text-align:right; vertical-align:middle; width:150px; }
.hd-right-cell .svc1 { font-size:8px; color:#334155; font-style:italic; }
.hd-right-cell .svc2 { font-size:11px; font-weight:900; color:#1a1a2e; font-style:italic; }
.hd-rule { border-bottom:1.5px solid #1a1a2e; margin:8px 0 6px; }

.ref-row { width:100%; border-collapse:collapse; margin-bottom:8px; }
.ref-row td { font-size:8px; color:#1a1a2e; }
.ref-row .fr { text-align:right; font-weight:700; }

/* TWO-COL INFO BOXES */
.info-table { width:100%; border-collapse:collapse; margin-bottom:8px; }
.info-table td { vertical-align:top; }
.info-table .col-left  { width:48%; padding-right:8px; }
.info-table .col-right { width:52%; }
.box { border:1px solid #64748b; border-radius:10px; padding:8px 10px; min-height:118px; }
.box .row { margin-bottom:3px; font-size:8px; }
.box .row .lbl { color:#1a1a2e; }
.box .row .val { font-weight:700; }
.s-name { font-size:14px; font-weight:900; color:#1a1a2e; margin-bottom:6px; }
.s-fil  { font-size:9px; font-weight:700; color:#1a1a2e; }

/* PLAIN FIELD ROWS */
.plain-row { font-size:9px; margin-bottom:5px; }
.plain-row .lbl { color:#1a1a2e; }
.plain-row .val { font-weight:700; }

/* MONTANT */
.montant-table { width:100%; border-collapse:collapse; margin:8px 0 3px; }
.montant-table td { font-size:9px; padding-right:14px; }
.montant-table .val { font-weight:700; }
.mots { font-size:9px; font-style:italic; font-weight:700; margin:4px 0 8px; }

/* NB */
.nb { font-size:8px; color:#1a1a2e; margin-bottom:8px; }
.nb b { font-weight:700; }

/* RAPPEL */
.rappel-title { font-size:9px; font-weight:700; margin-bottom:3px; text-decoration:underline; }
.rappel { border:1px solid #64748b; border-radius:6px; padding:6px 10px 8px; margin-bottom:10px; }
.rappel-table { width:100%; border-collapse:collapse; }
.rappel-table td { font-size:8px; padding:2px 6px; vertical-align:top; width:16.66%; }
.rappel-table .mn { color:#1a1a2e; }
.rappel-table .mv { font-weight:700; }
.rappel-table .paye .mv { color:#15803d; }
.rappel-table .du .mv { color:#b91c1c; }
.rappel-table .report { font-size:6.5px; font-weight:700; margin-top:1px; }
.rappel-table .report.neg { color:#b91c1c; }
.rappel-table .report.pos { color:#15803d; }

/* DETAIL FRAIS (bonus, garde la richesse des données) */
.det-title { font-size:8px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; background:#f1f5f9; padding:3px 8px; border:1px solid #cbd5e1; border-bottom:none; }
.det { width:100%; border-collapse:collapse; margin-bottom:8px; }
.det td { padding:3px 8px; font-size:8px; border:1px solid #e2e8f0; }
.det .l { color:#475569; width:60%; }
.det .v { font-weight:700; text-align:right; }
.det .tot td { font-weight:900; background:#f8fafc; }
.deficit-box { border-left:3px solid #b91c1c; background:#fef2f2; padding:4px 8px; margin-bottom:8px; font-size:8px; color:#7f1d1d; font-weight:700; }

/* BOTTOM */
.bot-table { width:100%; border-collapse:collapse; margin-top:10px; }
.bot-table td { vertical-align:bottom; }
.qr-cell { width:80px; }
.qr-cell img { width:64px; height:64px; }
.sig-cell { text-align:right; }
.sig-cell .exige { font-size:8px; text-decoration:underline; margin-bottom:14px; }
.sig-cell .dt { font-size:7.5px; color:#475569; }
.sig-cell .caisse { font-weight:700; font-size:9px; margin-top:4px; }

/* FOOTER */
.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:10px; padding-top:5px; }
.footer-table td { font-size:6.5px; color:#475569; vertical-align:middle; }
.footer-table .fr { text-align:right; font-family:'DejaVu Sans Mono',monospace; letter-spacing:1px; }
</style>
</head>
<body>

{{-- ══ HEADER ══════════════════════════════════════════════════════════════ --}}
<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-center-cell">
    <h2>Institut Supérieur d'Informatique</h2>
    <p>Un institut tourné vers les métiers d'avenir</p>
  </td>
  <td class="hd-right-cell">
    <div class="svc1">Service facturation</div>
    <div class="svc2">ISI SUPTECH</div>
  </td>
</tr></table>
<div class="hd-rule"></div>

<table class="ref-row"><tr>
  <td>{{ $refBordereau }}</td>
  <td class="fr">{{ $numInscription }}</td>
</tr></table>

{{-- ══ TWO-COLUMN INFO ═════════════════════════════════════════════════════ --}}
<table class="info-table"><tr>
  <td class="col-left">
    <div class="box">
      <div style="font-size:8.5px;font-weight:900;text-decoration:underline;margin-bottom:5px;">Infos reçu</div>
      <div class="row"><span class="lbl">N° reçu : </span><span class="val">{{ str_pad($payment->id, 5, '0', STR_PAD_LEFT) }}</span></div>
      <div class="row"><span class="lbl">Date : </span><span class="val">{{ $payment->date_paiement?->format('d/m/Y') ?? now()->format('d/m/Y') }}</span></div>
      <div class="row"><span class="lbl">Encaissé par : </span><span class="val">{{ $payment->saiseur?->name ?? 'ISI SUPTECH' }}</span></div>
      <div class="row"><span class="lbl">N° bordereau : </span><span class="val">—</span></div>
      <div class="row"><span class="lbl">Niveau : </span><span class="val">{{ $student->license?->nom ?? '—' }}</span></div>
      <div class="row"><span class="lbl">Mode paiement : </span><span class="val">{{ ucfirst($payment->methode ?? '—') }}</span></div>
      <div class="row"><span class="lbl">Réf pièce : </span><span class="val">{{ $refPiece }}</span></div>
      <div class="row"><span class="lbl">Banque : </span><span class="val">{{ in_array($payment->methode, ['cheque','virement']) ? '—' : '—' }}</span></div>
      <div class="row"><span class="lbl">Versé par : </span><span class="val">{{ $student->prenom }} {{ $student->nom }}</span></div>
    </div>
  </td>
  <td class="col-right">
    <div class="box">
      <div class="s-name">{{ $student->prenom }} {{ strtoupper($student->nom) }}</div>
      <div class="s-fil">{{ $student->filiere?->nom ?? '—' }}</div>
    </div>
  </td>
</tr></table>

{{-- ══ NATURE / TITRE / ANNEE ═══════════════════════════════════════════════ --}}
<div class="plain-row"><span class="lbl">Nature : </span><span class="val">{{ $payment->type === 'inscription' ? "Frais d'inscription" : ($payment->type === 'mensualite' ? ($groupePayments->count() > 1 ? 'Mensualités (paiement anticipé)' : 'Mensualité') : 'Paiement divers') }}</span></div>
<div class="plain-row"><span class="lbl">A titre de : </span><span class="val">{{ $titreLabel }}</span></div>
<div class="plain-row"><span class="lbl">Année : </span><span class="val">{{ $anneeScolaireLabel }}</span></div>

{{-- ══ MONTANT ═════════════════════════════════════════════════════════════ --}}
<table class="montant-table"><tr>
  <td>Montant reçu : <span class="val">{{ number_format($montantGroupe, 2, ',', ' ') }}</span></td>
  <td>Timbre : <span class="val">0,00</span></td>
  <td>Total reçu : <span class="val">{{ number_format($montantGroupe, 2, ',', ' ') }}</span></td>
</tr></table>
<div class="mots">{{ ucfirst($montantLettres) }}</div>

<table class="montant-table"><tr>
  <td>Restauration : <span class="val">0</span></td>
  <td>Transport : <span class="val">0</span></td>
  <td>Frais scolarité : <span class="val">{{ number_format($fraisMensuel, 0, ',', ' ') }}</span></td>
</tr></table>

<div class="nb">NB: Paiement le 5 de chaque mois au plus tard</div>

{{-- ══ RAPPEL FACTURES RESTANTES ═══════════════════════════════════════════ --}}
<div class="rappel-title">Rappel factures restantes</div>
<div class="rappel">
  <table class="rappel-table"><tr>
    @foreach($calMois as $m)
      @php
        $isPaye = in_array($m['cle'], $payesKeys) || $m['cle'] === $dernierMoisCle;
        $estCibleReport = !$isPaye && $m['cle'] === $premierMoisNonPaye && $soldeReporte != 0;
        $restant = $isPaye ? 0 : max(0, $fraisMensuel - ($estCibleReport ? $soldeReporte : 0));
      @endphp
      <td class="{{ $restant > 0 ? 'du' : 'paye' }}">
        <div class="mn">{{ $m['label'] }} :</div>
        <div class="mv">{{ number_format($restant, 0, ',', ' ') }}</div>
        @if($estCibleReport)
          <div class="report neg">Reste à payer</div>
        @endif
      </td>
      @if($loop->iteration % 6 === 0 && !$loop->last)
        </tr><tr>
      @endif
    @endforeach
  </tr></table>
</div>

{{-- ══ DÉTAIL FRAIS INSCRIPTION (complément d'information) ════════════════ --}}
@if($payment->type === 'inscription')
<div class="det-title">Détail des frais d'inscription</div>
<table class="det">
  <tr><td class="l">Frais de scolarité</td><td class="v">{{ number_format($fraisScolarite, 0, ',', ' ') }} FCFA</td></tr>
  <tr><td class="l">Participation AMEA</td><td class="v">{{ number_format($fraisAmea, 0, ',', ' ') }} FCFA</td></tr>
  <tr><td class="l">Tenue scolaire</td><td class="v">{{ number_format($fraisTenue, 0, ',', ' ') }} FCFA</td></tr>
  <tr><td class="l">Assurance scolaire</td><td class="v">{{ number_format($fraisAssurance, 0, ',', ' ') }} FCFA</td></tr>
  <tr><td class="l">Dernier mois (avance){{ $dernierMoisCle ? ' — ' . ($moisNoms[substr($dernierMoisCle,5,2)] ?? '') . ' ' . substr($dernierMoisCle,0,4) : '' }}</td><td class="v">{{ number_format($fraisMensuel, 0, ',', ' ') }} FCFA</td></tr>
  <tr class="tot"><td class="l">TOTAL DÛ</td><td class="v">{{ number_format($inscriptionTotal, 0, ',', ' ') }} FCFA</td></tr>
  <tr><td class="l">Déjà versé</td><td class="v">{{ number_format($inscriptionPaid, 0, ',', ' ') }} FCFA</td></tr>
</table>
@if($inscriptionRestant > 0)
<div class="deficit-box">Solde restant dû sur l'inscription : {{ number_format($inscriptionRestant, 0, ',', ' ') }} FCFA</div>
@endif
@endif

{{-- ══ BOTTOM : QR + SIGNATURE ═════════════════════════════════════════════ --}}
<table class="bot-table"><tr>
  <td class="qr-cell">
    @if(!empty($qrBase64))
      <img src="data:image/png;base64,{{ $qrBase64 }}"/>
    @endif
  </td>
  <td class="sig-cell">
    <div class="exige">Cachet et signature exigés</div>
    <div class="dt">{{ now()->format('d/m/Y à H:i:s') }}</div>
    <div class="caisse">La Caisse</div>
  </td>
</tr></table>

{{-- ══ FOOTER ══════════════════════════════════════════════════════════════ --}}
<table class="footer-table"><tr>
  <td>ISI SUPTECH — Dakar, Sénégal Tél: 33 825 62 10 &nbsp;E-mail: contact@isisuptech.com&nbsp; Web site: www.isisuptech.com</td>
  <td class="fr" style="width:120px;">{{ $refBordereau }}</td>
</tr></table>
<div style="text-align:center;font-size:6.5px;color:#94a3b8;margin-top:3px;">Développé par Multi Brain Tech</div>

</body>
</html>
