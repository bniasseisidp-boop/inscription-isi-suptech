<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Emploi du temps</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12.5px; color: #1a1a2e; padding: 20px; }

  .header { display: table; width: 100%; border-bottom: 3px solid #1a3a8f; padding-bottom: 14px; margin-bottom: 16px; }
  .header .logo-cell { display: table-cell; width: 50px; vertical-align: middle; }
  .header .logo-cell img { width: 44px; height: 44px; }
  .header .txt-cell { display: table-cell; vertical-align: middle; text-align: center; }
  .header h1 { font-size: 20px; color: #1a3a8f; font-weight: bold; margin-bottom: 3px; }
  .header p { font-size: 11px; color: #666; margin-bottom: 1px; }

  .meta { margin-bottom: 14px; }
  .badge { display: inline-block; background: #1a3a8f; color: white; padding: 4px 11px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 6px; }
  .badge-green { background: #0e6e3a; }

  .jour-titre { background: #1a3a8f; color: #fff; font-size: 11.5px; font-weight: bold; padding: 6px 10px; margin-top: 12px; border-radius: 4px 4px 0 0; }
  table.creneaux { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  table.creneaux thead tr { background: #eef2ff; }
  table.creneaux thead th { padding: 6px 8px; text-align: left; font-size: 10px; color: #334155; font-weight: bold; border-bottom: 1px solid #cbd5e1; }
  table.creneaux tbody td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: middle; }
  table.creneaux .heure { font-family: monospace; font-weight: bold; color: #1a3a8f; width: 110px; }
  table.creneaux .salle { color: #666; width: 90px; }

  .footer { margin-top: 18px; border-top: 1px solid #ccc; padding-top: 8px; }
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
    <p style="margin-top:6px; font-size:12px; font-weight:bold; color:#1a3a8f;">EMPLOI DU TEMPS — {{ $semestre->libelle }}</p>
  </div>
  <div class="logo-cell"></div>
</div>

<div class="meta">
  @if($filiere)<span class="badge">{{ $filiere->nom }}</span>@endif
  @if($license)<span class="badge badge-green">{{ $license->nom }}</span>@endif
</div>

@if($creneaux->isEmpty())
  <p style="color:#94a3b8; text-align:center; padding: 30px 0;">Aucun créneau n'a encore été programmé pour ce semestre.</p>
@else
  @foreach(['lundi' => 'Lundi', 'mardi' => 'Mardi', 'mercredi' => 'Mercredi', 'jeudi' => 'Jeudi', 'vendredi' => 'Vendredi', 'samedi' => 'Samedi'] as $jourKey => $jourLabel)
    @php $items = $creneaux->where('jour', $jourKey)->values(); @endphp
    @if($items->isNotEmpty())
      <div class="jour-titre">{{ $jourLabel }}</div>
      <table class="creneaux">
        <thead>
          <tr>
            <th class="heure">Horaire</th>
            <th>Matière</th>
            <th>Professeur</th>
            <th class="salle">Salle</th>
          </tr>
        </thead>
        <tbody>
          @foreach($items as $c)
            <tr>
              <td class="heure">{{ substr($c->heure_debut, 0, 5) }}–{{ substr($c->heure_fin, 0, 5) }}</td>
              <td>{{ $c->matiere }}</td>
              <td>{{ $c->professeur ?? '—' }}</td>
              <td class="salle">{{ $c->salle ?? '—' }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    @endif
  @endforeach
@endif

<div class="footer">
  <table>
    <tr>
      <td>ISI SUPTECH &mdash; Tél : 77 978 26 18 &mdash; www.isisuptech.com</td>
      <td class="right">Généré le {{ now()->format('d/m/Y à H:i') }}</td>
    </tr>
  </table>
</div>

</body>
</html>
