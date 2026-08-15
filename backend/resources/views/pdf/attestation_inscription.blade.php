@php
$moisDebut  = intval($student->license?->mois_debut ?? 9);
$now        = \Carbon\Carbon::now();
if ($student->annee_scolaire && preg_match('/^(\d{4})-\d{4}$/', $student->annee_scolaire, $mAnnee)) {
    $anneeDebut = (int) $mAnnee[1];
} else {
    $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
}
$anneeAcademique = $student->annee_scolaire ?? ($anneeDebut . '-' . ($anneeDebut + 1));

$niveauLabel = $student->niveau_entree ?? '1ère année';
$civilite = $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:10px; color:#1a1a2e; background:#fff; padding:24px 30px; }

.hd-table { width:100%; border-collapse:collapse; }
.hd-logo-cell { width:90px; vertical-align:top; }
.hd-logo-cell img { width:78px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell h1 { font-size:15px; font-weight:900; color:#1a1a2e; font-family:'DejaVu Serif',serif; }
.hd-sub { text-align:center; font-size:8px; color:#475569; font-style:italic; margin-top:2px; }

.shell { width:100%; border-collapse:collapse; margin-top:14px; }
.sidebar { width:88px; vertical-align:top; border-right:1.5px solid #1a1a2e; padding-right:8px; }
.sidebar .item { font-size:7px; font-weight:700; color:#1a1a2e; text-transform:uppercase; line-height:1.3; margin-bottom:30px; }
.content { vertical-align:top; padding-left:18px; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:26px; color:#1a1a2e; margin-bottom:4px; }
.annee { text-align:center; font-size:10px; margin-bottom:22px; }
.annee b { font-weight:700; }

.dropcap { font-family:'DejaVu Serif',serif; font-size:34px; font-weight:700; float:left; line-height:0.8; margin-right:4px; }
.p { font-size:10px; line-height:1.9; margin-bottom:14px; }
.p.indent { padding-left:14px; }
.field { font-size:10px; margin-bottom:14px; padding-left:14px; }
.field b { font-weight:700; }

.foi { font-size:10px; line-height:1.7; margin-top:8px; }

.sign-table { width:100%; border-collapse:collapse; margin-top:26px; }
.sign-table td { font-size:10px; text-align:right; }
.sign-table .dir { margin-top:34px; font-weight:700; }

.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:34px; padding-top:5px; }
.footer-table td { font-size:6.5px; color:#475569; vertical-align:middle; }
.footer-table .left  { font-weight:700; }
.footer-table .right { text-align:right; }
</style>
</head>
<body>

<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-center-cell"><h1>Institut Supérieur d'Informatique</h1></td>
  <td style="width:90px;"></td>
</tr></table>
<div class="hd-sub">Un institut tourné vers les métiers d'avenir</div>

<table class="shell"><tr>
  <td class="sidebar">
    <div class="item">Département<br/>Informatique</div>
    <div class="item">Département<br/>Télécom</div>
    <div class="item">Département<br/>Gestion</div>
    <div class="item">Certification<br/>Cisco</div>
    <div class="item">Certification<br/>Toeic</div>
    <div class="item">Institut<br/>d'Ingénierie</div>
    <div class="item">Institut<br/>Doctorale</div>
    <div class="item">Formation<br/>Initiale</div>
    <div class="item">Formation<br/>Continue</div>
  </td>
  <td class="content">
    <div class="title">Attestation d'inscription</div>
    <div class="annee">Année Académique : <b>{{ $anneeAcademique }}</b></div>

    <div class="p"><span class="dropcap">N</span>ous soussignés,</div>
    <div class="field">Institut Supérieur d'Informatique</div>
    <div class="p indent">attestons que :</div>
    <div class="field">{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</div>
    <div class="field">Né(e) le : <b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b> à <b>{{ $student->lieu_naissance ?? '—' }}</b></div>
    <div class="p indent">est officiellement inscrit(e) dans notre établissement en :</div>
    <div class="field">{{ $student->license?->nom ?? '—' }}</div>
    <div class="field">Spécialité : <b>{{ $student->filiere?->nom ?? '—' }}</b></div>
    <div class="field">Niveau : <b>{{ $niveauLabel }}</b></div>

    <div class="p foi">En foi de quoi, la présente attestation lui est délivrée pour servir et faire valoir ce que de droit.</div>

    <table class="sign-table"><tr><td>
      Fait à Dakar le, {{ now()->format('d/m/Y') }}
    </td></tr></table>
    <table class="sign-table"><tr><td>
      Directeur des études
      <div class="dir">Serigne M. Kara SAMB</div>
    </td></tr></table>
  </td>
</tr></table>

<table class="footer-table"><tr>
  <td class="left">ISI SUPTECH<br/>Dakar</td>
  <td class="right">Tél: 33 825 62 10 &nbsp;E-mail: contact@isisuptech.com &nbsp;Web site: www.isisuptech.com</td>
</tr></table>

</body>
</html>
