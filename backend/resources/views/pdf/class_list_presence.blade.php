<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Liste de présence</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a2e; padding: 18px; }

  .header { display: table; width: 100%; border-bottom: 3px solid #1a3a8f; padding-bottom: 12px; margin-bottom: 16px; }
  .header .logo-cell { display: table-cell; width: 46px; vertical-align: middle; }
  .header .logo-cell img { width: 40px; height: 40px; }
  .header .txt-cell { display: table-cell; vertical-align: middle; text-align: center; }
  .header h1 { font-size: 18px; color: #1a3a8f; font-weight: bold; margin-bottom: 2px; }
  .header p { font-size: 10px; color: #666; margin-bottom: 1px; }

  .meta { margin-bottom: 14px; }
  .badge { display: inline-block; background: #1a3a8f; color: white; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-right: 6px; }
  .badge-green { background: #0e6e3a; }
  .nb { font-size: 10px; color: #555; }

  table.liste { width: 100%; border-collapse: collapse; margin-top: 6px; }
  thead tr { background: #1a3a8f; color: white; }
  thead th { padding: 6px 5px; text-align: left; font-size: 10px; font-weight: bold; }
  tbody tr:nth-child(even) { background: #eef2ff; }
  tbody td { padding: 5px 5px; border-bottom: 1px solid #ddd; font-size: 10px; vertical-align: middle; }

  .statut-inscrit   { color: #0e6e3a; font-weight: bold; }
  .statut-attente-p { color: #b45309; }
  .statut-attente   { color: #555; }

  th.pres, td.pres { text-align: center; border-left: 1px solid #cbd5e1; width: 60px; }
  .case { display: inline-block; width: 14px; height: 14px; border: 1px solid #94a3b8; border-radius: 2px; }

  .footer { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; }
  .footer table { width: 100%; }
  .footer td { font-size: 9px; color: #888; }
  .footer .right { text-align: right; }
</style>
</head>
<body>

<div class="header">
  <div class="logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI SUPTECH"></div>
  <div class="txt-cell">
    <h1>ISI SUPTECH</h1>
    <p>Institut Supérieur d'Informatique — ISI SUPTECH</p>
    <p>Tél : 77 978 26 18 &nbsp;|&nbsp; www.isisuptech.com</p>
    <p style="margin-top:6px; font-size:12px; font-weight:bold; color:#1a3a8f;">LISTE DE PRÉSENCE — Année {{ $annee }}</p>
  </div>
  <div class="logo-cell"></div>
</div>

<div class="meta">
  <span class="badge">{{ $filiere->nom }}</span>
  @if($license)<span class="badge badge-green">{{ $license->nom }}</span>@endif
  <span class="nb">
    — {{ count($students) }} étudiant(s) au total
    ({{ collect($students)->where('sexe', 'M')->count() }} garçons, {{ collect($students)->where('sexe', 'F')->count() }} filles)
  </span>
</div>

<table class="liste">
  <thead>
    <tr>
      <th style="width:24px">#</th>
      <th style="width:78px">Matricule</th>
      <th>Nom & Prénom</th>
      <th style="width:18px">S.</th>
      <th style="width:65px">Statut</th>
      <th class="pres">Absent</th>
      <th class="pres">Présent</th>
    </tr>
  </thead>
  <tbody>
    @foreach($students as $i => $s)
    <tr>
      <td>{{ $i + 1 }}</td>
      <td style="font-family:monospace; font-size:9px;">{{ $s->matricule ?? '—' }}</td>
      <td><strong>{{ strtoupper($s->nom) }}</strong> {{ $s->prenom }}</td>
      <td>{{ $s->sexe === 'M' ? 'H' : 'F' }}</td>
      <td class="
        @if($s->statut_inscription === 'accepte') statut-inscrit
        @elseif($s->statut_inscription === 'en_attente_paiement') statut-attente-p
        @else statut-attente
        @endif
      ">
        @if($s->statut_inscription === 'accepte') ✓ Inscrit
        @elseif($s->statut_inscription === 'en_attente_paiement') Att. paiement
        @else En attente
        @endif
      </td>
      <td class="pres"><span class="case"></span></td>
      <td class="pres"><span class="case"></span></td>
    </tr>
    @endforeach
  </tbody>
</table>

<div class="footer">
  <table>
    <tr>
      <td>ISI SUPTECH &mdash; Tél : 77 978 26 18 &mdash; www.isisuptech.com</td>
      <td class="right">Généré le {{ now()->format('d/m/Y à H:i') }} &nbsp;|&nbsp; Créé par MULTI BRAIN TECH</td>
    </tr>
  </table>
</div>

</body>
</html>
