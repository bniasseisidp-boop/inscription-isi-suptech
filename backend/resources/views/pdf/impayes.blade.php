<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:10px; color:#1e293b; background:#fff; }

.header { background:#0d1f3c; padding:18px 28px 14px; }
.header-inner { display:flex; justify-content:space-between; align-items:center; }
.brand { display:flex; align-items:center; gap:14px; }
.brand img { width:52px; height:52px; object-fit:contain; }
.brand-text h1 { color:#fff; font-size:20px; font-weight:900; letter-spacing:3px; }
.brand-text p  { color:#93c5fd; font-size:8px; letter-spacing:1px; margin-top:3px; }
.title-block { text-align:right; }
.title-block .doc-title { color:#fff; font-size:14px; font-weight:900; letter-spacing:1px; }
.title-block .doc-sub   { color:rgba(255,255,255,.45); font-size:8px; margin-top:3px; }
.header-bar { background:#dc2626; padding:5px 28px; display:flex; justify-content:space-between; }
.header-bar span { color:#fff; font-size:8px; font-weight:700; letter-spacing:.5px; }

.body { padding:20px 28px; }

.meta-row { display:flex; gap:12px; margin-bottom:18px; }
.meta-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; }
.meta-card .mc-l { font-size:7.5px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; margin-bottom:3px; }
.meta-card .mc-v { font-size:14px; font-weight:900; color:#0d1f3c; }
.meta-card.red   { background:#fef2f2; border-color:#fecaca; }
.meta-card.red .mc-v { color:#dc2626; }

.section-label { font-size:7.5px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#94a3b8; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
.section-label::after { content:''; flex:1; height:1px; background:#e2e8f0; }

table { width:100%; border-collapse:collapse; }
thead tr { background:#0d1f3c; }
thead th { color:#fff; font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:8px 10px; text-align:left; }
tbody tr:nth-child(even) { background:#f8fafc; }
tbody td { padding:7px 10px; border-bottom:1px solid #f1f5f9; font-size:9.5px; vertical-align:middle; }
.mat-badge { background:#dbeafe; color:#1d4ed8; font-family:monospace; font-size:8.5px; font-weight:800; padding:2px 7px; border-radius:4px; display:inline-block; }
.badge-alert { background:#fee2e2; color:#b91c1c; font-size:7.5px; font-weight:800; padding:2px 7px; border-radius:20px; }

.footer { background:#0d1f3c; padding:10px 28px; display:flex; justify-content:space-between; align-items:center; margin-top:20px; }
.footer p { color:rgba(255,255,255,.4); font-size:7px; }
.footer strong { color:#60a5fa; }
</style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <div class="brand">
      <img src="{{ public_path('isi-logo.png') }}" alt="ISI" />
      <div class="brand-text">
        <h1>ISI SUPTECH</h1>
        <p>Institut Supérieur d'Informatique — Groupe ISI</p>
      </div>
    </div>
    <div class="title-block">
      <div class="doc-title">Liste des impayés</div>
      <div class="doc-sub">Service facturation — Confidentiel</div>
    </div>
  </div>
  <div class="header-bar" style="margin-top:12px;border-radius:0;">
    <span>Mensualités non réglées — {{ $moisLabel }}</span>
    <span>Édité le {{ now()->format('d/m/Y à H:i') }}</span>
  </div>
</div>

<div class="body">
  <div class="meta-row">
    <div class="meta-card">
      <div class="mc-l">Mois concerné</div>
      <div class="mc-v">{{ $moisLabel }}</div>
    </div>
    <div class="meta-card red">
      <div class="mc-l">Étudiants en retard</div>
      <div class="mc-v">{{ count($etudiants) }}</div>
    </div>
    <div class="meta-card">
      <div class="mc-l">Édité le</div>
      <div class="mc-v" style="font-size:11px;">{{ now()->format('d/m/Y') }}</div>
    </div>
  </div>

  <div class="section-label">Détail des étudiants</div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Matricule</th>
        <th>Étudiant</th>
        <th>Filière</th>
        <th>Niveau</th>
        <th>Téléphone</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      @forelse($etudiants as $i => $e)
      <tr>
        <td style="color:#94a3b8;font-weight:700;">{{ $i + 1 }}</td>
        <td><span class="mat-badge">{{ $e['matricule'] ?? '—' }}</span></td>
        <td>
          <div style="font-weight:700;">{{ strtoupper($e['nom'] ?? '') }} {{ $e['prenom'] ?? '' }}</div>
          @if(!empty($e['user']['email']))<div style="color:#64748b;font-size:8.5px;">{{ $e['user']['email'] }}</div>@endif
        </td>
        <td>{{ $e['filiere']['nom'] ?? '—' }}</td>
        <td>{{ $e['license']['nom'] ?? '—' }}</td>
        <td>{{ $e['telephone'] ?? '—' }}</td>
        <td><span class="badge-alert">Non réglé</span></td>
      </tr>
      @empty
      <tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic;">Aucun impayé pour ce mois</td></tr>
      @endforelse
    </tbody>
  </table>

  <div style="margin-top:24px;border-top:1px dashed #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;">
    <p style="font-size:8px;color:#64748b;">NB : Paiement dû au plus tard le 5 de chaque mois</p>
    <div style="text-align:center;">
      <div style="border-top:1px dashed #cbd5e1;padding-top:8px;width:160px;">
        <p style="font-size:8px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Signature Responsable Caisse</p>
      </div>
    </div>
  </div>
</div>

<div class="footer">
  <p>ISI SUPTECH — Dakar, Sénégal — Document confidentiel réservé à l'administration</p>
  <p>Développé par <strong>Multi Brain Tech</strong></p>
</div>

</body>
</html>
