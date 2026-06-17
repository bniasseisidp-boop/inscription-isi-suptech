<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DejaVu Sans',sans-serif; width:245px; height:155px; overflow:hidden; }
  .card { width:245px; height:155px; background:linear-gradient(135deg,#0a1628 0%,#1e3a5f 60%,#1d4ed8 100%); color:white; border-radius:10px; position:relative; overflow:hidden; }
  .card::before { content:''; position:absolute; top:-20px; right:-20px; width:120px; height:120px; border:2px solid rgba(255,255,255,0.08); border-radius:50%; }
  .card::after { content:''; position:absolute; top:10px; right:10px; width:80px; height:80px; border:2px solid rgba(255,255,255,0.06); border-radius:50%; }
  .top-bar { background:rgba(255,255,255,0.1); padding:6px 10px; display:flex; justify-content:space-between; align-items:center; }
  .school-name { font-size:9px; font-weight:700; letter-spacing:2px; color:#60a5fa; }
  .year { font-size:8px; opacity:.8; }
  .body { display:flex; padding:8px 10px; gap:10px; }
  .photo-area { width:48px; height:55px; border:2px solid #3b82f6; border-radius:5px; overflow:hidden; flex-shrink:0; background:#1e3a5f; }
  .photo-area img { width:100%; height:100%; object-fit:cover; }
  .photo-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:18px; color:rgba(255,255,255,0.4); }
  .info { flex:1; }
  .info .name { font-size:11px; font-weight:700; line-height:1.2; }
  .info .matricule { font-size:8px; color:#60a5fa; font-weight:600; margin:3px 0; letter-spacing:1px; }
  .info .filiere { font-size:8px; opacity:.8; margin:2px 0; }
  .info .license { font-size:8px; opacity:.7; }
  .qr-area { position:absolute; right:8px; bottom:8px; width:42px; height:42px; background:white; border-radius:3px; padding:2px; }
  .qr-area img { width:100%; height:100%; }
  .bottom-strip { position:absolute; bottom:0; left:0; right:50px; background:rgba(255,255,255,0.05); padding:4px 10px; }
  .bottom-strip .label { font-size:7px; opacity:.6; text-transform:uppercase; letter-spacing:1px; }
  .bottom-strip .value { font-size:8px; color:#93c5fd; }
  .stripe { position:absolute; left:0; top:50%; width:3px; height:40%; background:linear-gradient(to bottom,#3b82f6,#60a5fa); border-radius:0 2px 2px 0; transform:translateY(-50%); }
</style>
</head>
<body>
<div class="card">
  <div class="stripe"></div>
  <div class="top-bar">
    <span class="school-name">ISI SUPTECH</span>
    <span class="year">{{ $student->annee_scolaire }}</span>
  </div>
  <div class="body">
    <div class="photo-area">
      @if($student->photo)
        <img src="{{ storage_path('app/public/' . $student->photo) }}" alt="Photo">
      @else
        <div class="photo-placeholder">👤</div>
      @endif
    </div>
    <div class="info">
      <div class="name">{{ $student->full_name }}</div>
      <div class="matricule">{{ $student->matricule }}</div>
      <div class="filiere">{{ $student->filiere?->nom }}</div>
      <div class="license">{{ $student->license?->nom }}</div>
    </div>
  </div>
  <div class="bottom-strip">
    <div class="label">Carte Étudiante</div>
    <div class="value">{{ $student->card?->numero_carte }}</div>
  </div>
  <div class="qr-area">
    @if($student->qr_code_path)
      <img src="{{ storage_path('app/public/' . $student->qr_code_path) }}" alt="QR">
    @endif
  </div>
</div>
</body>
</html>
