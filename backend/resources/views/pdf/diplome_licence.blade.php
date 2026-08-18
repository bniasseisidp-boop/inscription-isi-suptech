@php
$civilite = $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.');
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:11px; color:#1a1a2e; background:#fdfdfb; }

.outer { position:relative; padding:12px; }
.frame-gold { border:2.5px solid #ca8a04; padding:5px; }
.frame-blue { border:1px solid #1a3a8f; padding:20px 46px 16px; position:relative; min-height:500px; }

.corner { position:absolute; width:24px; height:24px; }
.corner.tl { top:-1px; left:-1px; border-top:3px solid #7a1f2b; border-left:3px solid #7a1f2b; }
.corner.tr { top:-1px; right:-1px; border-top:3px solid #7a1f2b; border-right:3px solid #7a1f2b; }

.watermark { position:absolute; top:30%; left:0; right:0; text-align:center; font-family:'DejaVu Serif',serif; font-weight:900; font-size:110px; color:rgba(26,58,143,0.04); letter-spacing:4px; }

.hd-table { width:100%; border-collapse:collapse; position:relative; z-index:1; }
.hd-logo-cell { width:52px; vertical-align:middle; }
.hd-logo-cell img { width:42px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell .name { font-size:10px; font-weight:900; color:#1a3a8f; letter-spacing:2.5px; }
.hd-center-cell .sub  { font-size:7.5px; color:#64748b; letter-spacing:1px; margin-top:1px; }
.hd-right-cell { width:52px; text-align:right; vertical-align:middle; font-size:8px; color:#94a3b8; letter-spacing:1.5px; }
.gold-rule { border-bottom:1px solid #eab308; margin:8px 0 0; opacity:0.6; }

.title { text-align:center; font-family:'DejaVu Serif',serif; font-style:italic; font-weight:700; font-size:30px; color:#1a1a2e; margin-top:14px; position:relative; z-index:1; }
.title-rule { width:100px; height:2px; background:#ca8a04; margin:4px auto 0; }
.option { position:relative; z-index:1; text-align:center; font-size:12px; font-weight:700; color:#1a3a8f; margin-top:8px; margin-bottom:14px; }

.legal { position:relative; z-index:1; font-size:9.5px; line-height:1.65; color:#334155; margin-bottom:10px; }

.attest { position:relative; z-index:1; font-size:11.5px; font-style:italic; margin-bottom:14px; text-align:center; }

.deliv-table { position:relative; z-index:1; width:100%; border-collapse:collapse; margin-bottom:8px; }
.deliv-table td { font-size:12px; vertical-align:top; }
.deliv-table .l { font-style:italic; font-weight:700; }
.deliv-table .r { text-align:right; }
.deliv-table .r .mention { display:inline-block; border:1.5px solid #eab308; background:#fffbeb; color:#92660a; font-weight:900; padding:3px 12px; border-radius:6px; }

.annee { position:relative; z-index:1; font-size:11px; text-align:center; color:#475569; margin-bottom:16px; }

.a-line { position:relative; z-index:1; font-size:13px; text-align:center; margin-top:8px; }
.a-line b { font-weight:900; color:#1a3a8f; }

.sign-table { width:100%; border-collapse:collapse; margin-top:24px; position:relative; z-index:1; }
.sign-table td { text-align:center; font-size:9.5px; color:#334155; }
.sign-table .line { display:block; width:150px; margin:0 auto 4px; border-bottom:1px solid #94a3b8; height:26px; }
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

      <div class="title">Diplôme de Licence</div>
      <div class="title-rule"></div>
      <div class="option">Option : {{ $student->filiere?->nom ?? '—' }}</div>

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
        <td class="r">Avec la mention : <span class="mention">{{ $mention }}</span></td>
      </tr></table>
      <div class="annee">est délivrée au titre de l'année universitaire {{ $anneeAcademique }}</div>

      <div class="a-line">à &nbsp;<b>{{ $civilite }} {{ $student->prenom }} {{ strtoupper($student->nom) }}</b> &nbsp; né(e) le &nbsp;<b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b> &nbsp; à &nbsp;<b>{{ $student->lieu_naissance ?? '—' }}</b></div>

      <table class="sign-table"><tr>
        <td>
          <span class="line"></span>
          <span class="role">Le Directeur des Études</span>
        </td>
        <td>
          <span class="line"></span>
          <span class="role">Le Président du Groupe ISI</span>
        </td>
      </tr></table>
    </div>
  </div>
</div>
</body>
</html>
