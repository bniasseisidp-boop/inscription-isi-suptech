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
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:8px; color:#1a1a2e; background:#fff; padding:16px 18px; }

.hd-table { width:100%; border-collapse:collapse; background:#eef2f7; border-radius:4px; }
.hd-table td { padding:8px 12px; vertical-align:middle; }
.hd-icon { width:50px; }
.hd-icon img { width:40px; }
.hd-title { text-align:center; font-size:15px; font-weight:900; }
.hd-date { text-align:right; font-size:11px; font-weight:900; width:110px; }

.fait-par { font-size:8px; margin:8px 0 10px; }
.fait-par b { font-weight:700; }

.mode-title { font-size:9px; font-weight:900; margin:10px 0 3px; }
.mode-table { width:100%; border-collapse:collapse; margin-bottom:4px; }
.mode-table th { background:#f1f5f9; border:1px solid #cbd5e1; font-size:7px; font-weight:900; text-transform:uppercase; padding:3px 4px; text-align:left; }
.mode-table td { border:1px solid #e2e8f0; font-size:7px; padding:2px 4px; }
.mode-table .num { text-align:right; }
.total-row td { font-weight:900; background:#f8fafc; text-align:right; }
.total-row .lbl { text-align:left; }

.footer-table { width:100%; border-collapse:collapse; border-top:1px solid #94a3b8; margin-top:14px; padding-top:4px; }
.footer-table td { font-size:6.5px; color:#475569; }
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
  <td class="fr">ISI SUPTECH — Dakar, Sénégal &nbsp;|&nbsp; Multi Brain Tech</td>
</tr></table>

</body>
</html>
