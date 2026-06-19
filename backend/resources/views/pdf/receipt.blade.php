@php
/* ── Variables calculées ─────────────────────────────────────────── */
$moisNoms = ['01'=>'Janvier','02'=>'Février','03'=>'Mars','04'=>'Avril','05'=>'Mai',
             '06'=>'Juin','07'=>'Juillet','08'=>'Août','09'=>'Septembre',
             '10'=>'Octobre','11'=>'Novembre','12'=>'Décembre'];
$moisCourts = ['01'=>'Jan','02'=>'Fév','03'=>'Mar','04'=>'Avr','05'=>'Mai','06'=>'Jun',
               '07'=>'Jul','08'=>'Aoû','09'=>'Sep','10'=>'Oct','11'=>'Nov','12'=>'Déc'];

// Titre "À titre de"
if ($payment->mois) {
    $numMoisPmt = substr($payment->mois, 5, 2);
    $titreLabel  = ($moisNoms[$numMoisPmt] ?? $payment->mois) . ' ' . substr($payment->mois, 0, 4);
} elseif ($payment->type === 'inscription') {
    $titreLabel = "Frais d'inscription";
} else {
    $titreLabel = '—';
}

// Année scolaire
$moisDebut  = intval($student->license?->mois_debut ?? 9);
$moisFin    = intval($student->license?->mois_fin   ?? 6);
$now        = \Carbon\Carbon::now();
$anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
$anneeFin   = $anneeDebut + (($moisFin < $moisDebut) ? 1 : 0);
$nowStr     = $now->format('Y-m');

// Mois payés
$payesKeys = collect($moisPayesList)->pluck('cle')->toArray();

// Construction des mois de l'année scolaire
$calMois = [];
$cur     = \Carbon\Carbon::create($anneeDebut, $moisDebut, 1);
$endCal  = \Carbon\Carbon::create($anneeFin, $moisFin, 1);
while ($cur->lte($endCal)) {
    $calMois[] = ['cle' => $cur->format('Y-m'), 'num' => $cur->format('m')];
    $cur->addMonth();
}

// Paiement partiel sur ce mois ?
$moisPmtKey = $payment->mois;
$deficitCeMois = null;
foreach ($deficits as $d) {
    if ($d['mois'] === $moisPmtKey) {
        $deficitCeMois = $d;
        break;
    }
}

// Ref numéro doc
$refPiece = $student->numero_cni ?? $student->matricule ?? '—';

// Annee scolaire label
$anneeScolaireLabel = $student->annee_scolaire ?? ($anneeDebut . '-' . ($anneeDebut + 1));
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:8.5px; color:#1e293b; background:#fff; padding:10px 12px 8px; }

/* HEADER */
.hd-table { width:100%; border-collapse:collapse; border-bottom:2px solid #0d1f3c; padding-bottom:6px; margin-bottom:6px; }
.hd-logo-cell { width:220px; vertical-align:top; }
.hd-logo-inner { display:table; }
.hd-logo-img  { display:table-cell; vertical-align:middle; width:54px; padding-right:8px; }
.hd-logo-img img { width:50px; height:50px; }
.hd-logo-text { display:table-cell; vertical-align:middle; }
.hd-logo-text h1 { font-size:14px; font-weight:900; color:#0d1f3c; letter-spacing:2px; }
.hd-logo-text .s1 { font-size:7px; color:#1d4ed8; font-weight:700; margin-top:2px; }
.hd-logo-text .s2 { font-size:6.5px; color:#64748b; margin-top:1px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell h2 { font-size:10px; font-weight:900; color:#0d1f3c; }
.hd-center-cell p  { font-size:6.5px; color:#64748b; font-style:italic; margin-top:2px; }
.hd-right-cell { text-align:right; vertical-align:top; width:130px; }
.hd-right-cell .svc { font-size:8px; font-weight:900; color:#1d4ed8; font-style:italic; line-height:1.5; }
.hd-ref { font-size:7.5px; font-weight:700; color:#0d1f3c; padding-top:4px; border-top:1px solid #e2e8f0; margin-top:5px; }

/* TWO-COL INFO — table-based */
.info-table { width:100%; border-collapse:collapse; margin-bottom:7px; margin-top:7px; }
.info-table td { vertical-align:top; }
.info-table .col-left  { width:48%; padding-right:5px; }
.info-table .col-right { width:52%; padding-left:0; }
.box { border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; }
.box-title { font-size:7px; font-weight:900; color:#0d1f3c; text-transform:uppercase; letter-spacing:1px; background:#f1f5f9; padding:3px 8px; border-bottom:1px solid #e2e8f0; }
.box-body  { padding:5px 8px; }
.row { margin-bottom:2.5px; font-size:8px; line-height:1.35; }
.row table { border-collapse:collapse; width:100%; }
.row .lbl { color:#64748b; width:82px; vertical-align:top; font-size:7.5px; }
.row .val { font-weight:700; color:#0d1f3c; font-size:8px; }
.mat-chip { background:#dbeafe; color:#1d4ed8; font-family:monospace; font-size:8.5px; font-weight:900; padding:1px 7px; border-radius:3px; display:inline; }
.s-name { font-size:12.5px; font-weight:900; color:#0d1f3c; margin:3px 0 2px; }
.s-fil  { font-size:8px; color:#1d4ed8; font-weight:700; }

/* DETAIL TABLE */
.det { width:100%; border-collapse:collapse; margin-bottom:7px; }
.det td { padding:4px 7px; border:1px solid #e2e8f0; font-size:8.5px; }
.det .lbl { color:#64748b; background:#f8fafc; font-weight:600; width:110px; }
.det .val { font-weight:700; color:#0d1f3c; }

/* MONTANT BLOCK */
.mt-table { width:100%; border-collapse:collapse; background:#0d1f3c; border-radius:5px; margin-bottom:5px; }
.mt-table td { padding:8px 12px; vertical-align:middle; }
.mt-l .lbl-m  { color:rgba(255,255,255,.5); font-size:6.5px; text-transform:uppercase; letter-spacing:1px; }
.mt-l .t-row  { margin-top:3px; font-size:7.5px; color:rgba(255,255,255,.6); }
.mt-r { text-align:right; width:160px; }
.mt-r .big    { font-size:22px; font-weight:900; color:#fff; line-height:1; }
.mt-r .curr   { font-size:6.5px; color:rgba(255,255,255,.5); }
.lettres { font-size:8px; font-style:italic; color:#0d1f3c; border:1px solid #e2e8f0; padding:3px 8px; border-radius:3px; margin-bottom:6px; background:#f8fafc; }
.lettres .lbl { color:#64748b; font-size:7px; font-style:normal; }

/* DEFICIT ALERT */
.deficit-box { border-left:3px solid #f59e0b; background:#fffbeb; padding:4px 8px; margin-bottom:6px; border-radius:0 3px 3px 0; font-size:7.5px; color:#92400e; font-weight:700; }

/* FRAIS GRID */
.fg-table { width:100%; border-collapse:collapse; margin-bottom:6px; }
.fg-table td { border:1px solid #e2e8f0; padding:4px 7px; width:25%; }
.fg-table .fc-l { font-size:6.5px; color:#64748b; margin-bottom:1px; }
.fg-table .fc-v { font-size:9.5px; font-weight:900; color:#0d1f3c; }

/* NB */
.nb { font-size:7.5px; color:#dc2626; font-weight:700; margin-bottom:6px; border-left:2.5px solid #dc2626; padding-left:5px; }

/* RAPPEL MOIS */
.rappel { border:1.5px solid #0d1f3c; border-radius:4px; margin-bottom:7px; overflow:hidden; }
.rappel-title { background:#0d1f3c; color:#fff; font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:1px; padding:3px 8px; }
.rappel-table { width:100%; border-collapse:collapse; padding:5px; }
.rappel-table td { padding:3px 3px; text-align:center; }
.mc { border:1px solid #cbd5e1; border-radius:3px; padding:3px 4px; }
.mc .mn { font-size:7.5px; font-weight:700; color:#0d1f3c; }
.mc .mv { font-size:6.5px; color:#64748b; margin-top:1px; }
.mc.paye   { background:#dcfce7; border-color:#86efac; }
.mc.paye   .mn { color:#15803d; }
.mc.paye   .mv { color:#16a34a; font-weight:700; }
.mc.actuel { background:#dbeafe; border-color:#93c5fd; }
.mc.actuel .mn { color:#1d4ed8; }
.mc.actuel .mv { color:#2563eb; font-weight:700; }
.mc.impaye { background:#fff7ed; border-color:#fed7aa; }
.mc.impaye .mn { color:#c2410c; }
.mc.impaye .mv { color:#ea580c; }

/* BOTTOM */
.bot-table { width:100%; border-collapse:collapse; margin-top:7px; }
.bot-table td { vertical-align:bottom; }
.qr-cell  { width:82px; text-align:center; vertical-align:middle; }
.qr-cell img { width:68px; height:68px; }
.qr-cell .ql { font-size:6px; color:#64748b; margin-top:2px; }
.qr-cell .qd { font-size:5.5px; color:#94a3b8; }
.sig-table { width:100%; border-collapse:collapse; }
.sig-table td { text-align:center; padding:0 5px; vertical-align:bottom; }
.sig-line  { border-top:1.5px dashed #cbd5e1; padding-top:4px; margin-top:38px; }
.sig-lbl   { font-size:6.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
.stamp-cell { width:38%; }
.stamp-box  { border:2px dashed #94a3b8; border-radius:5px; min-height:48px; text-align:center; padding-top:18px; }
.stamp-lbl  { font-size:6.5px; color:#cbd5e1; text-transform:uppercase; letter-spacing:1px; }

/* FOOTER */
.footer-table { width:100%; border-collapse:collapse; border-top:1.5px solid #0d1f3c; margin-top:7px; padding-top:4px; }
.footer-table td { font-size:6.5px; color:#94a3b8; padding-top:4px; vertical-align:top; }
.footer-table .fr { text-align:right; }
.footer-table strong { color:#1d4ed8; }
</style>
</head>
<body>

{{-- ══ HEADER ══════════════════════════════════════════════════════════════ --}}
<table class="hd-table"><tr>
  <td class="hd-logo-cell">
    <div class="hd-logo-inner">
      <div class="hd-logo-img"><img src="{{ public_path('isi-logo.png') }}" alt="ISI" /></div>
      <div class="hd-logo-text">
        <h1>ISI SUPTECH</h1>
        <div class="s1">Institut Supérieur d'Informatique</div>
        <div class="s2">Un institut tourné vers les métiers de l'avenir</div>
      </div>
    </div>
  </td>
  <td class="hd-center-cell">
    <h2>Institut Supérieur d'Informatique</h2>
    <p>Un institut tourné vers les métiers de l'avenir</p>
  </td>
  <td class="hd-right-cell">
    <div class="svc">Service facturation<br/>ISI SUPTECH</div>
  </td>
</tr></table>
<div class="hd-ref">
  {{ str_pad($payment->id, 2, '0', STR_PAD_LEFT) }}-{{ now()->format('y') }}-{{ str_pad($payment->id * 7 + 1200, 4, '0', STR_PAD_LEFT) }}/ISI SUPTECH
</div>

{{-- ══ TWO-COLUMN INFO ═════════════════════════════════════════════════════ --}}
<table class="info-table"><tr>
  <td class="col-left">
    <div class="box">
      <div class="box-title">Infos reçu</div>
      <div class="box-body">
        <div class="row"><table><tr><td class="lbl">N° reçu :</td><td class="val">{{ str_pad($payment->id, 5, '0', STR_PAD_LEFT) }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Date :</td><td class="val">{{ $payment->date_paiement?->format('d/m/Y') ?? now()->format('d/m/Y') }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Encaissé par :</td><td class="val">ISI SUPTECH</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Filière :</td><td class="val">{{ $student->filiere?->nom ?? '—' }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Niveau :</td><td class="val">{{ $student->license?->nom ?? '—' }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Mode paiement :</td><td class="val">{{ strtoupper($payment->methode ?? '—') }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Réf. pièce :</td><td class="val">{{ $refPiece }}</td></tr></table></div>
        <div class="row"><table><tr><td class="lbl">Versé par :</td><td class="val">{{ $student->prenom }} {{ $student->nom }}</td></tr></table></div>
      </div>
    </div>
  </td>
  <td class="col-right">
    <div class="box">
      <div class="box-title">Informations étudiant</div>
      <div class="box-body">
        <span class="mat-chip">{{ $student->matricule ?? 'ISI-' . date('Y') . '-?????' }}</span>
        <div class="s-name">{{ strtoupper($student->nom) }} {{ $student->prenom }}</div>
        <div class="s-fil">{{ $student->filiere?->nom ?? '—' }}</div>
        <div style="margin-top:5px;">
          <div class="row"><table><tr><td class="lbl">Email :</td><td class="val" style="font-size:7.5px;">{{ $student->email ?? $student->user?->email ?? '—' }}</td></tr></table></div>
          <div class="row"><table><tr><td class="lbl">Tél. :</td><td class="val">{{ $student->telephone ?? '—' }}</td></tr></table></div>
          <div class="row"><table><tr><td class="lbl">Année scolaire :</td><td class="val">{{ $anneeScolaireLabel }}</td></tr></table></div>
        </div>
      </div>
    </div>
  </td>
</tr></table>

{{-- ══ PAYMENT DETAILS ═════════════════════════════════════════════════════ --}}
<table class="det">
  <tr>
    <td class="lbl">Nature</td>
    <td class="val">{{ $payment->type === 'inscription' ? "Frais d'inscription" : ($payment->type === 'mensualite' ? 'Mensualité' : 'Paiement divers') }}</td>
    <td class="lbl">Année scolaire</td>
    <td class="val">{{ $anneeScolaireLabel }}</td>
  </tr>
  <tr>
    <td class="lbl">À titre de</td>
    <td class="val">{{ $titreLabel }}</td>
    <td class="lbl">Date paiement</td>
    <td class="val">{{ $payment->date_paiement?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i') }}</td>
  </tr>
</table>

{{-- ══ MONTANT ═════════════════════════════════════════════════════════════ --}}
<table class="mt-table"><tr>
  <td class="mt-l">
    <div class="lbl-m">Montant reçu</div>
    <div class="t-row">Timbre : 0,00 &nbsp;&nbsp; Total reçu : {{ number_format($payment->montant, 0, ',', ' ') }} FCFA</div>
  </td>
  <td class="mt-r">
    <div class="big">{{ number_format($payment->montant, 0, ',', ' ') }}</div>
    <div class="curr">Francs CFA (XOF)</div>
  </td>
</tr></table>

<div class="lettres"><span class="lbl">En toutes lettres : </span>{{ $montantLettres }}</div>

{{-- ══ ALERTE PAIEMENT PARTIEL ════════════════════════════════════════════ --}}
@if($payment->type === 'inscription' && $inscriptionRestant > 0)
<div class="deficit-box">
  ⚠️ Paiement partiel — Frais d'inscription : {{ number_format($inscriptionPaid, 0, ',', ' ') }} FCFA versés
  sur {{ number_format($fraisInscription, 0, ',', ' ') }} FCFA attendus — <strong>Solde restant dû :
  <span style="color:#dc2626;">{{ number_format($inscriptionRestant, 0, ',', ' ') }} FCFA</span></strong>
</div>
@elseif($deficitCeMois)
<div class="deficit-box">
  ⚠️ Paiement partiel pour {{ $titreLabel }} : {{ number_format($deficitCeMois['paye'], 0, ',', ' ') }} FCFA versés
  sur {{ number_format($deficitCeMois['attendu'], 0, ',', ' ') }} FCFA — Solde restant dû :
  <span style="color:#dc2626;">{{ number_format($deficitCeMois['manque'], 0, ',', ' ') }} FCFA</span>
</div>
@endif

{{-- ══ FRAIS GRID ══════════════════════════════════════════════════════════ --}}
<table class="fg-table"><tr>
  <td><div class="fc-l">Frais inscription</div><div class="fc-v">{{ number_format($fraisInscription, 0, ',', ' ') }}</div></td>
  <td><div class="fc-l">Mensualité/mois</div><div class="fc-v">{{ number_format($fraisMensuel, 0, ',', ' ') }}</div></td>
  <td><div class="fc-l">Total payé</div><div class="fc-v">{{ number_format($totalPaid, 0, ',', ' ') }}</div></td>
  <td><div class="fc-l">Reste à payer</div><div class="fc-v" style="color:#dc2626;">{{ number_format($totalRestant, 0, ',', ' ') }}</div></td>
</tr></table>

<div class="nb">NB : Les mensualités sont dues au plus tard le 5 de chaque mois. Tout retard peut entraîner des pénalités.</div>

{{-- ══ RAPPEL FACTURES ════════════════════════════════════════════════════ --}}
<div class="rappel">
  <div class="rappel-title">Rappel factures — Année scolaire {{ $anneeDebut }}-{{ $anneeDebut + 1 }}</div>
  @php
    $perRow = count($calMois);
    $colW   = max(1, intval(100 / max($perRow, 1)));
  @endphp
  <table class="rappel-table" style="padding:5px;"><tr>
    @foreach($calMois as $m)
      @php
        $isPaye   = in_array($m['cle'], $payesKeys);
        $isActuel = ($m['cle'] === $nowStr);
        $css      = $isPaye ? 'paye' : ($isActuel ? 'actuel' : 'impaye');
        $valLabel = $isPaye ? 'Payé' : number_format($fraisMensuel, 0, ',', ' ');
      @endphp
      <td style="width:{{ $colW }}%;text-align:center;padding:3px 2px;">
        <div class="mc {{ $css }}">
          <div class="mn">{{ $moisCourts[$m['num']] ?? $m['num'] }}</div>
          <div class="mv">{{ $valLabel }}</div>
        </div>
      </td>
    @endforeach
  </tr></table>
</div>

{{-- ══ BOTTOM : QR + SIGNATURES ═══════════════════════════════════════════ --}}
<table class="bot-table"><tr>
  <td class="qr-cell">
    @if(!empty($qrBase64))
      <img src="data:image/png;base64,{{ $qrBase64 }}" />
    @else
      <div style="width:68px;height:68px;border:1px dashed #cbd5e1;"></div>
    @endif
    <div class="ql">Vérification QR</div>
    <div class="qd">{{ now()->format('d/m/Y à H:i') }}</div>
  </td>
  <td>
    <table class="sig-table"><tr>
      <td style="width:31%;"><div class="sig-line"></div><div class="sig-lbl">Signature Caissier</div></td>
      <td class="stamp-cell">
        <div class="stamp-box"><div class="stamp-lbl">Cachet officiel</div></div>
      </td>
      <td style="width:31%;"><div class="sig-line"></div><div class="sig-lbl">Signature Étudiant</div></td>
    </tr></table>
  </td>
</tr></table>

{{-- ══ FOOTER ══════════════════════════════════════════════════════════════ --}}
<table class="footer-table"><tr>
  <td>ISI SUPTECH — Dakar, Sénégal &nbsp;|&nbsp; Tél : <strong>77 978 26 18</strong> &nbsp;|&nbsp; <strong>www.isisuptech.com</strong></td>
  <td class="fr">Document officiel — <strong>Conservez ce reçu précieusement</strong></td>
</tr></table>

</body>
</html>
