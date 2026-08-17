@php
$moisNoms = ['01'=>'Janvier','02'=>'Février','03'=>'Mars','04'=>'Avril','05'=>'Mai',
             '06'=>'Juin','07'=>'Juillet','08'=>'Août','09'=>'Septembre',
             '10'=>'Octobre','11'=>'Novembre','12'=>'Décembre'];
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:10px; color:#1a1a2e; background:#fff; padding:18px 20px; }

.hd-table { width:100%; border-collapse:collapse; background:#eef2f7; border-radius:4px; }
.hd-table td { padding:9px 13px; vertical-align:middle; }
.hd-icon { width:52px; }
.hd-icon img { width:42px; }
.hd-title { text-align:center; font-size:17px; font-weight:900; }
.hd-date { text-align:right; font-size:12.5px; font-weight:900; width:115px; }

.fait-par { font-size:10px; margin:10px 0 12px; }
.fait-par b { font-weight:700; }

.mode-title { font-size:10.5px; font-weight:900; margin:12px 0 4px; }
.mode-table { width:100%; border-collapse:collapse; margin-bottom:5px; }
.mode-table th { background:#f1f5f9; border:1px solid #cbd5e1; font-size:8.5px; font-weight:900; text-transform:uppercase; padding:4px 5px; text-align:left; }
.mode-table td { border:1px solid #e2e8f0; font-size:8.5px; padding:3px 5px; }
.mode-table .num { text-align:right; }
.total-row td { font-weight:900; background:#f8fafc; text-align:right; }
.total-row .lbl { text-align:left; }

.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:16px; padding-top:5px; }
.footer-table td { font-size:8px; color:#475569; }
.footer-table .fr { text-align:right; }
</style>
</head>
<body>

<table class="hd-table"><tr>
  <td class="hd-icon"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-title">Brouillard Encaissement du jour</td>
  <td class="hd-date">{{ $date->format('d/m/Y') }}</td>
</tr></table>

<div class="fait-par">Fait par : <b>{{ $faitPar }}</b></div>

@foreach($groupes as $mode => $lignes)
  <div class="mode-title">Mode paiement &nbsp; {{ $mode }}</div>
  <table class="mode-table">
    <thead><tr>
      <th style="width:12%;">Num pièce</th>
      <th style="width:12%;">Identifiant</th>
      <th style="width:8%;">N° reçu</th>
      <th style="width:13%;">Matricule</th>
      <th style="width:22%;">Prénom et nom</th>
      <th style="width:7%;">Heure</th>
      <th style="width:11%;">Le mois</th>
      <th style="width:15%;" class="num">Montant</th>
    </tr></thead>
    <tbody>
      @foreach($lignes as $l)
        <tr>
          <td>{{ $l['num_piece'] }}</td>
          <td>{{ $l['identifiant'] }}</td>
          <td>{{ $l['numero_recu'] }}</td>
          <td>{{ $l['matricule'] }}</td>
          <td>{{ $l['nom_complet'] }}</td>
          <td>{{ $l['heure'] }}</td>
          <td>{{ $l['mois'] }}</td>
          <td class="num">{{ number_format($l['montant'], 0, ',', ' ') }}</td>
        </tr>
      @endforeach
      <tr class="total-row">
        <td colspan="7" class="lbl">Total mode :</td>
        <td class="num">{{ number_format(collect($lignes)->sum('montant'), 0, ',', ' ') }}</td>
      </tr>
    </tbody>
  </table>
@endforeach

@if(count($groupes) === 0)
  <p style="margin-top:20px;color:#64748b;">Aucun encaissement enregistré pour cette date.</p>
@else
  <div style="margin-top:10px;font-size:9px;font-weight:900;text-align:right;">
    Total général du jour : {{ number_format($totalGeneral, 0, ',', ' ') }} FCFA
  </div>
@endif

<table class="footer-table"><tr>
  <td>{{ now()->format('d/m/Y à H:i:s') }}</td>
  <td class="fr">ISI SUPTECH — Dakar, Sénégal</td>
</tr></table>

</body>
</html>
