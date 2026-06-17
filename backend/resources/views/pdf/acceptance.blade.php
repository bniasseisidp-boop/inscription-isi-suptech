<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DejaVu Sans',sans-serif; font-size:12px; color:#1a2744; }
  .header { background:linear-gradient(135deg,#0a1628,#1e3a5f); color:white; padding:25px 40px; }
  .header h1 { font-size:24px; font-weight:700; letter-spacing:3px; }
  .header p { opacity:.8; font-size:11px; margin-top:4px; }
  .watermark { position:fixed; top:35%; left:15%; font-size:80px; font-weight:900; color:rgba(59,130,246,0.06); transform:rotate(-35deg); white-space:nowrap; z-index:0; }
  .body { padding:40px; position:relative; z-index:1; }
  .ref { text-align:right; color:#64748b; font-size:10px; margin-bottom:30px; }
  .title { text-align:center; margin-bottom:30px; }
  .title h2 { font-size:20px; color:#1e3a5f; text-transform:uppercase; letter-spacing:3px; border-bottom:3px solid #3b82f6; display:inline-block; padding-bottom:8px; }
  .student-box { background:linear-gradient(135deg,#eff6ff,#dbeafe); border:2px solid #3b82f6; border-radius:12px; padding:20px 25px; margin:20px 0; }
  .student-box h3 { font-size:20px; color:#1e3a5f; font-weight:700; }
  .student-box .info { color:#3b82f6; font-size:12px; margin-top:5px; }
  .matricule-box { background:#1e3a5f; color:white; border-radius:8px; padding:12px 20px; text-align:center; margin:20px 0; }
  .matricule-box .label { font-size:10px; opacity:.7; text-transform:uppercase; letter-spacing:2px; }
  .matricule-box .value { font-size:24px; font-weight:700; letter-spacing:4px; margin-top:4px; }
  .program { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:20px 0; }
  .prog-item { background:#f8faff; border-left:3px solid #3b82f6; padding:10px 15px; }
  .prog-item .label { font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; }
  .prog-item .value { font-size:13px; color:#1e3a5f; font-weight:600; margin-top:3px; }
  p.body-text { line-height:1.7; color:#374151; margin:15px 0; font-size:12px; }
  .signature { margin-top:40px; text-align:right; }
  .signature .sig-line { border-top:2px solid #1e3a5f; width:200px; display:inline-block; }
  .signature p { font-size:11px; color:#64748b; margin-top:5px; }
  .footer { background:#0a1628; color:rgba(255,255,255,0.6); text-align:center; padding:12px; font-size:9px; margin-top:30px; }
  .footer strong { color:#60a5fa; }
</style>
</head>
<body>
<div class="watermark">ISI SUPTECH</div>

<div class="header">
  <h1>ISI SUPTECH</h1>
  <p>Institut Supérieur d'Informatique — Groupe ISI — Dakar, Sénégal</p>
</div>

<div class="body">
  <div class="ref">
    <p>Réf. : ISI/SCOL/{{ date('Y') }}/{{ str_pad($student->id, 5, '0', STR_PAD_LEFT) }}</p>
    <p>Date : {{ now()->format('d F Y') }}</p>
  </div>

  <div class="title">
    <h2>Lettre d'Acceptation d'Inscription</h2>
  </div>

  <p class="body-text">
    L'Institut Supérieur d'Informatique <strong>ISI SUPTECH</strong>, après examen de votre dossier de candidature, a le plaisir de vous informer que votre inscription pédagogique a été <strong>acceptée</strong> pour l'année académique <strong>{{ $student->annee_scolaire }}</strong>.
  </p>

  <div class="student-box">
    <h3>{{ $student->full_name }}</h3>
    <div class="info">
      {{ $student->date_naissance?->format('d/m/Y') }} — {{ $student->lieu_naissance }} — {{ $student->nationalite }}
    </div>
  </div>

  <div class="matricule-box">
    <div class="label">Votre numéro matricule étudiant</div>
    <div class="value">{{ $student->matricule }}</div>
  </div>

  <div class="program">
    <div class="prog-item">
      <div class="label">Filière</div>
      <div class="value">{{ $student->filiere?->nom }}</div>
    </div>
    <div class="prog-item">
      <div class="label">Niveau / Licence</div>
      <div class="value">{{ $student->license?->nom }}</div>
    </div>
    <div class="prog-item">
      <div class="label">Durée de formation</div>
      <div class="value">{{ $student->license?->duree_annees }} an(s)</div>
    </div>
    <div class="prog-item">
      <div class="label">Année académique</div>
      <div class="value">{{ $student->annee_scolaire }}</div>
    </div>
  </div>

  <p class="body-text">
    Pour finaliser votre inscription, vous êtes invité(e) à procéder au paiement des <strong>frais d'inscription</strong> via votre espace étudiant sur la plateforme. Un reçu vous sera envoyé automatiquement après confirmation du paiement.
  </p>

  <p class="body-text">
    Nous vous souhaitons la bienvenue au sein de la famille ISI SUPTECH et vous encourageons dans la poursuite de votre excellence académique.
  </p>

  <div class="signature">
    <div class="sig-line"></div>
    <p>La Direction des Études</p>
    <p><strong>ISI SUPTECH</strong></p>
  </div>
</div>

<div class="footer">
  <p>Plateforme de gestion académique ISI SUPTECH — inscription.isisuptech.com</p>
  <p>Développé par <strong>Multi Brain Tech</strong></p>
</div>
</body>
</html>
