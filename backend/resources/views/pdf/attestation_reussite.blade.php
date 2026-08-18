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
.hd-ref { text-align:right; width:110px; vertical-align:top; }
.ref-box { display:inline-block; min-width:90px; border:1.5px solid #1a1a2e; border-radius:6px; padding:5px 10px; font-size:10px; font-weight:900; color:#1a1a2e; }

.shell { width:100%; border-collapse:collapse; margin-top:22px; }
.sidebar { width:108px; vertical-align:top; border-right:1.5px solid #1a1a2e; padding-right:12px; }
.sidebar .item { font-size:9px; font-weight:700; color:#1a1a2e; text-transform:uppercase; line-height:1.35; margin-bottom:37px; }
.content { vertical-align:top; padding-left:26px; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:30px; color:#1a1a2e; margin-bottom:6px; }
.annee { text-align:center; font-size:13px; margin-bottom:18px; }
.annee b { font-weight:700; }

.legal { font-size:9.5px; line-height:1.65; color:#334155; margin-bottom:14px; }

.dropcap { font-family:'DejaVu Serif',serif; font-size:38px; font-weight:700; float:left; line-height:0.8; margin-right:6px; }
.p { font-size:12.5px; line-height:1.9; margin-bottom:14px; }
.p.indent { padding-left:18px; }
.field { font-size:12.5px; margin-bottom:12px; padding-left:18px; }
.field b { font-weight:700; }

.bot-table { width:100%; border-collapse:collapse; margin-top:20px; }
.bot-table td { vertical-align:bottom; }
.qr-cell { width:80px; }
.qr-cell img { width:60px; height:60px; }
.sign-cell { text-align:right; font-size:12.5px; }
.sign-cell .dir { margin-top:10px; font-weight:700; font-size:13px; }

.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:18px; padding-top:8px; }
.footer-table td { font-size:9.5px; color:#475569; vertical-align:middle; }
.footer-table .left  { font-weight:700; }
.footer-table .right { text-align:right; }
</style>
</head>
<body>

<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-center-cell"><h1>Institut Supérieur d'Informatique</h1></td>
  <td class="hd-ref"><div class="ref-box">REF :&nbsp;</div></td>
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
    <div class="title">Attestation de Réussite</div>
    <div class="annee">Année Académique : <b>{{ $anneeAcademique }}</b></div>

    <div class="legal">
      Vu la loi 91-22 du 16 février 1991 portant orientation de l'Education Nationale, modifiée ;<br/>
      Vu la loi 94-82 du 23 décembre 1994 portant statut des Etablissements d'Enseignement Privé ;<br/>
      Vu la loi n° 2005-03 du 11 janvier 2005 modifiant et complétant les articles 6 et 8 de la loi 94-82 du 23 décembre 1994 portant statut des Etablissements d'Enseignement Privé ;<br/>
      Vu la loi n° 2011-05 du 30 mars 2011 relative à l'organisation du système LMD (Licence, Master, Doctorat) dans les Etablissements d'Enseignement Supérieur ;<br/>
      Vu le décret 2011-1030 du 25 juillet 2011 portant statut des Etablissements Privés d'Enseignement Supérieur ;<br/>
      Vu le procès-verbal de délibération.
    </div>

    <div class="p"><span class="dropcap">A</span>ttestons que :</div>
    <div class="field">{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</div>
    <div class="field">Né(e) le : <b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b> à <b>{{ $student->lieu_naissance ?? '—' }}</b></div>
    <div class="p indent">a validé avec succès le cycle :</div>
    <div class="field">{{ $student->license?->nom ?? '—' }}</div>
    <div class="field">Domaine : <b>{{ $domaine }}</b></div>
    <div class="field">Spécialité : <b>{{ $student->filiere?->nom ?? '—' }}</b></div>
    <div class="field">Mention : <b>{{ $mention }}</b></div>
    <div class="field">Session : <b>Normale</b></div>

    <table class="bot-table"><tr>
      <td class="qr-cell">
        @if(!empty($qrBase64))
          <img src="data:image/png;base64,{{ $qrBase64 }}" alt="QR"/>
        @endif
      </td>
      <td class="sign-cell">
        Fait à Dakar le, {{ now()->format('d/m/Y') }}<br/>
        Directeur des études
        <div class="dir">Serigne M. Kara SAMB</div>
      </td>
    </tr></table>
  </td>
</tr></table>

<table class="footer-table"><tr>
  <td class="left">ISI SUPTECH<br/>Dakar</td>
  <td class="right">Tél: 33 825 62 10 &nbsp;E-mail: contact@isisuptech.com &nbsp;Web site: www.isisuptech.com</td>
</tr></table>

</body>
</html>
