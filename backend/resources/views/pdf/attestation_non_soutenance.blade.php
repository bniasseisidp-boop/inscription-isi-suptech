@php
$civilite = $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:13px; color:#1a1a2e; background:#fff; padding:34px 42px; }

.hd-table { width:100%; border-collapse:collapse; }
.hd-logo-cell { width:110px; vertical-align:top; }
.hd-logo-cell img { width:96px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell h1 { font-size:19px; font-weight:900; color:#1a1a2e; font-family:'DejaVu Serif',serif; }
.hd-sub { text-align:center; font-size:10.5px; color:#475569; font-style:italic; margin-top:4px; }

.shell { width:100%; border-collapse:collapse; margin-top:26px; }
.sidebar { width:108px; vertical-align:top; border-right:1.5px solid #1a1a2e; padding-right:12px; }
.sidebar .item { font-size:9px; font-weight:700; color:#1a1a2e; text-transform:uppercase; line-height:1.35; margin-bottom:46px; }
.content { vertical-align:top; padding-left:26px; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:28px; color:#1a1a2e; margin-bottom:6px; }
.annee { text-align:center; font-size:13px; margin-bottom:36px; }
.annee b { font-weight:700; }

.dropcap { font-family:'DejaVu Serif',serif; font-size:38px; font-weight:700; float:left; line-height:0.8; margin-right:6px; }
.p { font-size:13px; line-height:1.9; margin-bottom:15px; }
.p.indent { padding-left:18px; }
.field { font-size:13px; margin-bottom:15px; padding-left:18px; }
.field b { font-weight:700; }

.foi { font-size:13px; line-height:1.7; margin-top:10px; margin-bottom:16px; }

.sign-table { width:100%; border-collapse:collapse; margin-top:24px; }
.sign-table td { font-size:13px; text-align:right; }
.sign-table .dir { margin-top:26px; font-weight:700; font-size:14px; }

.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:24px; padding-top:8px; }
.footer-table td { font-size:9.5px; color:#475569; vertical-align:middle; }
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
    <div class="title">Attestation de non soutenance</div>
    <div class="annee">Année Académique : <b>{{ $anneeAcademique }}</b></div>

    <div class="p"><span class="dropcap">N</span>ous soussignés,</div>
    <div class="field">Institut Supérieur d'Informatique</div>
    <div class="p indent">attestons que :</div>
    <div class="field">{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</div>
    <div class="field">Né(e) le : <b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b> à <b>{{ $student->lieu_naissance ?? '—' }}</b></div>
    <div class="p indent">est déclaré(e) admissible à l'examen de :</div>
    <div class="field">{{ $student->filiere?->nom ?? '—' }}</div>
    <div class="field">Niveau : <b>{{ $student->license?->nom ?? '—' }}</b></div>

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
