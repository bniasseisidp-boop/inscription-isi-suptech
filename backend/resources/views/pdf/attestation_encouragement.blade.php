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

.corner-blue { position:absolute; top:0; right:0; width:0; height:0; border-style:solid; border-width:0 60px 60px 0; border-color:transparent #1a3a8f transparent transparent; }
.corner-red { position:absolute; bottom:0; left:0; width:0; height:0; border-style:solid; border-width:60px 60px 0 0; border-color:#7a1f2b transparent transparent transparent; }

.page { position:relative; padding:40px 56px; min-height:760px; }
.hd-table { width:100%; border-collapse:collapse; }
.hd-left { font-size:10px; letter-spacing:2px; color:#334155; }
.hd-right { text-align:right; }
.hd-right .logo { font-family:'DejaVu Serif',serif; font-weight:900; font-size:20px; color:#1a3a8f; }
.hd-right .logo b { color:#7a1f2b; }

.corner-mark { position:absolute; top:100px; left:56px; width:60px; height:60px; border-top:1.5px solid #1a3a8f; border-left:1.5px solid #1a3a8f; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:40px; color:#1a1a2e; margin-top:120px; margin-bottom:50px; }

.p { font-size:14px; line-height:2.3; text-align:center; max-width:560px; margin:0 auto 10px; }
.p b { font-weight:700; }
.moyenne { text-align:center; font-size:15px; font-weight:900; margin-top:26px; }
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

  <div class="title">Encouragement</div>

  <div class="p">
    Cette présente attestation est attribuée à l'apprenant<br/>
    <b>{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</b> de la classe de <b>{{ $classeLabel }}</b><br/>
    suite aux résultats obtenus au <b>{{ $periode }}</b> de l'année <b>{{ $anneeAcademique }}</b>
  </div>

  <div class="moyenne">Moyenne : {{ $moyenne }}</div>
</div>
</body>
</html>
