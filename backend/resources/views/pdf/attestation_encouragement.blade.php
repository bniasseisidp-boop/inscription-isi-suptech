@php
$civilite = $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:13px; color:#1a1a2e; background:#fdfdfb; }

.outer { position:relative; padding:14px; }
.frame-gold { border:2.5px solid #ca8a04; padding:6px; }
.frame-blue { border:1px solid #1a3a8f; padding:30px 50px 26px; position:relative; }

.corner { position:absolute; width:26px; height:26px; }
.corner.tl { top:-1px; left:-1px; border-top:3px solid #7a1f2b; border-left:3px solid #7a1f2b; }
.corner.tr { top:-1px; right:-1px; border-top:3px solid #7a1f2b; border-right:3px solid #7a1f2b; }

.watermark { position:absolute; top:38%; left:0; right:0; text-align:center; font-family:'DejaVu Serif',serif; font-weight:900; font-size:120px; color:rgba(26,58,143,0.045); letter-spacing:4px; }

.hd-table { width:100%; border-collapse:collapse; position:relative; z-index:1; }
.hd-logo-cell { width:60px; vertical-align:middle; }
.hd-logo-cell img { width:48px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell .name { font-size:11px; font-weight:900; color:#1a3a8f; letter-spacing:3px; }
.hd-center-cell .sub  { font-size:8.5px; color:#64748b; letter-spacing:1px; margin-top:2px; }
.hd-right-cell { width:60px; text-align:right; vertical-align:middle; font-size:9px; color:#94a3b8; letter-spacing:2px; }

.gold-rule { border-bottom:1px solid #eab308; margin:14px 0 0; opacity:0.6; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:42px; color:#1a1a2e; margin:26px 0 8px; position:relative; z-index:1; }
.title-rule { width:120px; height:2px; background:#ca8a04; margin:0 auto 28px; }

.p { position:relative; z-index:1; font-size:15px; line-height:2.3; text-align:center; max-width:620px; margin:0 auto; }
.p b { font-weight:700; color:#1a3a8f; }

.moyenne-box { position:relative; z-index:1; display:table; margin:22px auto 0; border:1.5px solid #eab308; border-radius:8px; padding:9px 26px; background:#fffbeb; }
.moyenne-box .lbl { font-size:9px; text-transform:uppercase; letter-spacing:2px; color:#92660a; }
.moyenne-box .val { font-size:20px; font-weight:900; color:#1a3a8f; margin-top:2px; }

.sign-table { width:100%; border-collapse:collapse; margin-top:34px; position:relative; z-index:1; }
.sign-table td { text-align:center; font-size:10.5px; color:#334155; }
.sign-table .line { display:block; width:170px; margin:0 auto 6px; border-bottom:1px solid #94a3b8; height:24px; }
.sign-table .role { font-weight:700; color:#1a1a2e; }
</style>
</head>
<body>
<div class="outer">
  <div class="frame-gold">
    <div class="frame-blue">
      <div class="corner tl"></div><div class="corner tr"></div>
      <div class="watermark">ISI</div>

      <table class="hd-table"><tr>
        <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
        <td class="hd-center-cell">
          <div class="name">GROUPE ISI &nbsp;—&nbsp; INSTITUT SUPÉRIEUR D'INFORMATIQUE</div>
          <div class="sub">SÉNÉGAL</div>
        </td>
        <td class="hd-right-cell">SÉNÉGAL</td>
      </tr></table>
      <div class="gold-rule"></div>

      <div class="title">Encouragement</div>
      <div class="title-rule"></div>

      <div class="p">
        Cette présente attestation est attribuée à l'apprenant<br/>
        <b>{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</b> de la classe de <b>{{ $classeLabel }}</b><br/>
        suite aux résultats obtenus au <b>{{ $periode }}</b> de l'année <b>{{ $anneeAcademique }}</b>
      </div>

      <div class="moyenne-box">
        <div class="lbl">Moyenne obtenue</div>
        <div class="val">{{ $moyenne }}</div>
      </div>

      <table class="sign-table"><tr>
        <td>
          <span class="line"></span>
          <span class="role">Le Directeur des Études</span>
        </td>
      </tr></table>
    </div>
  </div>
</div>
</body>
</html>
