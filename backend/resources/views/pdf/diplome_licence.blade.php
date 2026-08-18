@php
$civilite = $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:13px; color:#1a1a2e; background:#fff; position:relative; }

/* Coins décoratifs (triangles bleu/rouge, style GROUPE ISI) */
.corner-blue { position:absolute; top:0; right:0; width:0; height:0; border-style:solid; border-width:0 60px 60px 0; border-color:transparent #1a3a8f transparent transparent; }
.corner-red { position:absolute; bottom:0; left:0; width:0; height:0; border-style:solid; border-width:60px 60px 0 0; border-color:#7a1f2b transparent transparent transparent; }

.page { position:relative; padding:40px 56px; min-height:760px; }
.hd-table { width:100%; border-collapse:collapse; }
.hd-left { font-size:10px; letter-spacing:2px; color:#334155; }
.hd-right { text-align:right; }
.hd-right .logo { font-family:'DejaVu Serif',serif; font-weight:900; font-size:20px; color:#1a3a8f; }
.hd-right .logo b { color:#7a1f2b; }
.hd-right .sub { font-size:8px; color:#64748b; letter-spacing:1px; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:36px; color:#1a1a2e; margin-top:60px; }
.option { text-align:center; font-size:13px; font-weight:700; margin-top:6px; margin-bottom:34px; }

.legal { font-size:10.5px; line-height:1.9; color:#1a1a2e; margin-bottom:18px; }

.attest { font-size:13px; font-style:italic; margin-bottom:26px; }

.deliv-table { width:100%; border-collapse:collapse; margin-bottom:26px; }
.deliv-table td { font-size:13px; vertical-align:top; }
.deliv-table .l { font-style:italic; }
.deliv-table .r { text-align:right; font-weight:700; }

.a-line { font-size:13px; margin-top:30px; }
.a-line b { font-weight:900; }

.corner-mark { position:absolute; top:100px; left:56px; width:60px; height:60px; border-top:1.5px solid #1a3a8f; border-left:1.5px solid #1a3a8f; }
</style>
</head>
<body>
<div class="page">
  <div class="corner-blue"></div>
  <div class="corner-red"></div>
  <div class="corner-mark"></div>

  <table class="hd-table"><tr>
    <td class="hd-left">SENEGAL</td>
    <td class="hd-right">
      <div class="logo">GROUPE <b>ISI</b></div>
    </td>
  </tr></table>

  <div class="title">Diplôme de Licence</div>
  <div class="option">Option: {{ $student->filiere?->nom ?? '—' }}</div>

  <div class="legal">
    Vu la loi 91-22 du 16 février 1991 portant orientation de l'Education Nationale, modifiée ;<br/>
    Vu la loi 94-82 du 23 décembre 1994 portant statut des Etablissements d'Enseignement Privé ;<br/>
    Vu la loi n° 2005-03 du 11 janvier 2005 modifiant et complétant les articles 6 et 8 de la loi 94-82 du 23 décembre 1994 portant statut des Etablissements d'Enseignement Privé ;<br/>
    Vu la loi n° 2011-05 du 30 mars 2011 relative à l'organisation du système LMD (Licence, Master, Doctorat) dans les Etablissements d'Enseignement Supérieur ;<br/>
    Vu le décret 2011-1030 du 25 juillet 2011 portant statut des Etablissements Privés d'Enseignement Supérieur ;<br/>
    Vu le procès-verbal de délibération.
  </div>

  <div class="attest">Attestant que l'intéressé(e) a satisfait au contrôle des connaissances et des aptitudes prévu par les tests réglementaires</div>

  <table class="deliv-table"><tr>
    <td class="l">La Licence (Bac + 3) en {{ $student->filiere?->nom ?? '—' }}</td>
    <td class="r">Avec la mention : {{ $mention }}</td>
  </tr></table>
  <div>est délivrée au titre de l'année universitaire {{ $anneeAcademique }}</div>

  <div class="a-line">à &nbsp;<b>{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</b> &nbsp; né(e) le &nbsp;<b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b> &nbsp; à &nbsp;<b>{{ $student->lieu_naissance ?? '—' }}</b></div>
</div>
</body>
</html>
