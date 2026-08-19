<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:8px; color:#111827; padding:14px 18px; }

.header { display:table; width:100%; border-bottom:3px solid #1a3a8f; padding-bottom:10px; margin-bottom:10px; }
.header .logo-cell { display:table-cell; width:44px; vertical-align:middle; }
.header .logo-cell img { width:38px; }
.header .txt-cell { display:table-cell; vertical-align:middle; text-align:center; }
.header h1 { font-size:16px; color:#1a3a8f; font-weight:900; }
.header .sous-titre { font-size:12px; font-weight:900; color:#111827; margin-top:2px; text-transform:uppercase; }
.header .meta { font-size:9px; color:#666; margin-top:2px; }

table.grand-tableau { width:100%; border-collapse:collapse; margin-bottom:12px; }
table.grand-tableau th, table.grand-tableau td { border:1px solid #94a3b8; padding:3px 4px; text-align:center; }
table.grand-tableau thead .ue-head { background:#1a3a8f; color:#fff; font-size:7.5px; font-weight:900; }
table.grand-tableau thead .sub-head { background:#e2e8f0; font-size:6.5px; font-weight:700; color:#334155; }
table.grand-tableau tbody td.ident { text-align:left; font-size:7.5px; }
table.grand-tableau tbody td.matricule { font-family:monospace; font-size:6.5px; color:#64748b; }
table.grand-tableau tbody tr:nth-child(even) { background:#f8fafc; }

.valide { color:#fff; background:#1a3a8f; border-radius:3px; padding:1px 3px; font-size:6.5px; font-weight:700; }
.invalide { color:#fff; background:#b91c1c; border-radius:3px; padding:1px 3px; font-size:6.5px; font-weight:700; }

.bottom { display:table; width:100%; margin-top:10px; }
.bottom .col { display:table-cell; vertical-align:top; padding-right:14px; }

.stats-title { font-size:9px; font-weight:900; color:#1a3a8f; margin-bottom:4px; }
table.stats { border-collapse:collapse; width:100%; margin-bottom:10px; }
table.stats th, table.stats td { border:1px solid #cbd5e1; padding:3px 6px; font-size:7.5px; text-align:center; }
table.stats th { background:#f1f5f9; font-weight:900; }

.legende { border:1px solid #cbd5e1; padding:6px 10px; font-size:7px; color:#475569; }
.legende b { color:#1a1a2e; }

.footer { margin-top:14px; border-top:1px solid #ccc; padding-top:6px; display:table; width:100%; }
.footer .l { display:table-cell; font-size:7.5px; color:#888; }
.footer .r { display:table-cell; text-align:right; font-size:7.5px; color:#888; }
</style>
</head>
<body>

<div class="header">
  <div class="logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"></div>
  <div class="txt-cell">
    <h1>ISI SUPTECH</h1>
    <div class="sous-titre">Grand tableau de délibération — {{ $conseil['semestre']->libelle }}</div>
    <div class="meta">{{ $conseil['semestre']->license?->filiere?->nom }} — {{ $conseil['semestre']->license?->nom }} — Année {{ $conseil['annee_scolaire'] }}</div>
  </div>
  <div class="logo-cell"></div>
</div>

<table class="grand-tableau">
  <thead>
    <tr>
      <th class="ue-head" rowspan="2" style="width:60px;">Matricule</th>
      <th class="ue-head" rowspan="2" style="width:130px;">Nom & Prénom</th>
      @foreach($conseil['modules_stats'] as $i => $ms)
        <th class="ue-head" colspan="2">UE{{ $i + 1 }} — {{ $ms['module']->code }}</th>
      @endforeach
      <th class="ue-head" rowspan="2" style="width:55px;">Moyenne<br>générale</th>
      <th class="ue-head" rowspan="2" style="width:45px;">Crédits</th>
      <th class="ue-head" rowspan="2" style="width:70px;">Résultat</th>
    </tr>
    <tr>
      @foreach($conseil['modules_stats'] as $ms)
        <th class="sub-head">Moy</th>
        <th class="sub-head">Validation</th>
      @endforeach
    </tr>
  </thead>
  <tbody>
    @foreach($conseil['lignes'] as $ligne)
      <tr>
        <td class="matricule">{{ $ligne['student']->matricule }}</td>
        <td class="ident"><strong>{{ strtoupper($ligne['student']->nom) }}</strong> {{ $ligne['student']->prenom }}</td>
        @foreach($ligne['modules'] as $mod)
          <td>{{ $mod['moyenne_ue'] !== null ? number_format($mod['moyenne_ue'], 2, ',', '') : '—' }}</td>
          <td><span class="{{ $mod['valide'] ? 'valide' : 'invalide' }}">{{ $mod['valide'] ? 'Validée' : 'Invalidée' }}</span></td>
        @endforeach
        <td><strong>{{ $ligne['moyenne_generale'] !== null ? number_format($ligne['moyenne_generale'], 2, ',', '') : '—' }}</strong></td>
        <td>{{ number_format($ligne['credits_obtenus'], 1, ',', '') }} / {{ $conseil['semestre']->credits_requis }}</td>
        <td><span class="{{ $ligne['valide'] ? 'valide' : 'invalide' }}">{{ $ligne['mention'] }}</span></td>
      </tr>
    @endforeach
    @if(empty($conseil['lignes']))
      <tr><td colspan="{{ 5 + count($conseil['modules_stats']) * 2 }}" style="padding:14px; color:#94a3b8;">Aucun étudiant inscrit sur ce niveau.</td></tr>
    @endif
  </tbody>
</table>

<div class="bottom">
  <div class="col" style="width:55%;">
    <div class="stats-title">Résultats par UE</div>
    <table class="stats">
      <thead><tr><th>UE</th><th>Validés</th><th>Taux</th></tr></thead>
      <tbody>
        @foreach($conseil['modules_stats'] as $i => $ms)
          <tr>
            <td style="text-align:left;">UE{{ $i + 1 }} — {{ $ms['module']->nom }}</td>
            <td>{{ $ms['nb_valides'] }} / {{ $conseil['effectif_total'] }}</td>
            <td>{{ number_format($ms['pourcentage'], 2, ',', '') }} %</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </div>
  <div class="col" style="width:45%;">
    <div class="stats-title">Répartition des mentions</div>
    <table class="stats">
      <thead><tr><th>Mention</th><th>Effectif</th><th>Taux</th></tr></thead>
      <tbody>
        @foreach($conseil['mentions_distribution'] as $m)
          <tr>
            <td style="text-align:left;">{{ $m['mention'] }}</td>
            <td>{{ $m['count'] }}</td>
            <td>{{ number_format($m['pourcentage'], 2, ',', '') }} %</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </div>
</div>

<div class="legende">
  <b>Effectif total :</b> {{ $conseil['effectif_total'] }} &nbsp;·&nbsp;
  <b>Réussites :</b> {{ $conseil['reussites'] }} &nbsp;·&nbsp;
  <b>Taux de réussite :</b> {{ number_format($conseil['taux_reussite'], 2, ',', '') }} % &nbsp;·&nbsp;
  Résultat = mention globale du semestre (moyenne générale pondérée par crédits des UE)
</div>

<div class="footer">
  <div class="l">ISI SUPTECH — Tél : 77 978 26 18 — www.isisuptech.com</div>
  <div class="r">Généré le {{ now()->format('d/m/Y à H:i') }}</div>
</div>

</body>
</html>
