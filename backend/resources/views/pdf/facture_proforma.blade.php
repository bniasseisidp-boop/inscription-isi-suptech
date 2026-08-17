<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:14px; line-height:1.5; color:#1a1a2e; background:#fff; padding:36px 46px 24px; }

/* HEADER */
.hd-table { width:100%; border-collapse:collapse; }
.hd-logo-cell { width:84px; vertical-align:middle; }
.hd-logo-cell img { width:70px; }
.hd-title-cell { vertical-align:middle; padding-left:16px; }
.hd-title-cell h1 { font-size:23px; font-weight:900; color:#1a3a8f; letter-spacing:.5px; }
.hd-certs { margin-top:8px; }
.hd-certs img { height:26px; margin-right:16px; vertical-align:middle; }
.hd-rule { border-bottom:2.5px solid #1a3a8f; margin:12px 0 22px; }

.doc-title { text-align:right; font-size:19px; font-weight:900; letter-spacing:2px; color:#1a1a2e; margin-bottom:22px; text-transform:uppercase; }

.ref-box { display:inline-block; border:1.5px solid #1a3a8f; border-radius:6px; padding:8px 18px; font-size:14px; font-weight:900; color:#1a3a8f; margin-bottom:24px; }

/* TWO-COL INFO BOXES */
.info-table { width:100%; border-collapse:collapse; margin-bottom:28px; }
.info-table td { vertical-align:top; }
.info-table .col-left  { width:48%; padding-right:16px; }
.info-table .col-right { width:52%; }
.box { border:1.5px solid #1a1a2e; border-radius:10px; padding:20px 22px; min-height:130px; }
.box .entreprise { font-size:17px; font-weight:900; margin-bottom:8px; }
.box .fixe { font-size:14px; color:#334155; }
.frow { width:100%; border-collapse:collapse; }
.frow td { font-size:14px; padding:5px 0; vertical-align:top; }
.frow .l { color:#475569; width:34%; }
.frow .v { font-weight:700; }

/* PRICING TABLE */
.pricing { width:100%; border-collapse:collapse; margin-bottom:20px; border:1.5px solid #1a1a2e; }
.pricing th { background:#eef2f7; border:1px solid #1a1a2e; font-size:12.5px; font-weight:900; text-transform:uppercase; padding:11px 12px; text-align:left; }
.pricing td { border-left:1px solid #94a3b8; border-right:1px solid #94a3b8; border-top:none; border-bottom:none; padding:13px 12px; font-size:14px; vertical-align:top; }
.pricing .duree { font-style:italic; font-weight:700; text-align:left; }
.pricing .designation-head { font-weight:900; text-decoration:underline; font-size:15px; }
.pricing .num { text-align:right; }
.pricing .tot td { font-weight:900; background:#f8fafc; font-size:16px; padding:14px 12px; border-top:1.5px solid #1a1a2e; }
.pricing .tot .lbl { font-style:italic; }

.mots { font-size:14px; margin-bottom:8px; }
.mots b { font-weight:700; }
.compte { font-size:12.5px; color:#334155; }
.compte .ninea { margin-top:2px; }

/* SIGNATURE */
.sign-table { width:100%; border-collapse:collapse; margin:22px 0 20px; }
.sign-table td { text-align:right; font-size:14px; font-weight:900; }
.sign-space { height:55px; }

/* FOOTER */
.yellow-bar { background:#fde047; padding:7px 16px; text-align:center; font-size:11px; font-weight:700; color:#1a1a2e; margin-top:6px; }
.footer-addr { text-align:center; font-size:9.5px; color:#475569; margin-top:5px; }
</style>
</head>
<body>

<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-title-cell">
    <h1>Institut Supérieur d'Informatique</h1>
    <div class="hd-certs">
      <img src="{{ public_path('microsoft.png') }}" alt="Microsoft"/>
      <img src="{{ public_path('cisco.png') }}" alt="Cisco"/>
      <img src="{{ public_path('fnege.png') }}" alt="FNEGE"/>
      <img src="{{ public_path('sap.png') }}" alt="SAP University"/>
      <img src="{{ public_path('cames.png') }}" alt="CAMES"/>
    </div>
  </td>
</tr></table>
<div class="hd-rule"></div>

<div class="doc-title">Facture Proforma</div>
<div class="ref-box">REF : #{{ $reference }}</div>

{{-- ══ TWO-COLUMN INFO ═══════════════════════════════════════════════════ --}}
<table class="info-table"><tr>
  <td class="col-left">
    <div class="box">
      <div class="entreprise">{{ $entreprise }}</div>
      <div class="fixe">Dakar / SENEGAL</div>
    </div>
  </td>
  <td class="col-right">
    <div class="box">
      <table class="frow">
        <tr><td class="l">Date :</td><td class="v">{{ now()->format('d/m/Y') }}</td></tr>
        <tr><td class="l">Objet :</td><td class="v">Formation en {{ $filiere?->nom }}</td></tr>
        <tr><td class="l">Pour :</td><td class="v">{{ $beneficiaire }}</td></tr>
        <tr><td class="l">Suivi par :</td><td class="v">{{ $suiviPar }}</td></tr>
      </table>
    </div>
  </td>
</tr></table>

{{-- ══ PRICING TABLE ═══════════════════════════════════════════════════════ --}}
<table class="pricing">
  <thead><tr>
    <th style="width:20%;">Durée</th>
    <th style="width:44%;">Désignation</th>
    <th style="width:16%;" class="num">P. Unitaire</th>
    <th style="width:20%;" class="num">Montant</th>
  </tr></thead>
  <tbody>
    <tr>
      <td class="duree" rowspan="3">
        Année académique<br/>({{ $anneeAcademique }})<br/><br/>{{ $nbMois }} mois
      </td>
      <td class="designation-head">{{ $license->nom }}</td>
      <td class="num"></td>
      <td class="num"></td>
    </tr>
    <tr>
      <td>Droit d'inscription (dernier mois inclus)</td>
      <td class="num">{{ number_format($fraisInscription, 0, ',', ' ') }}</td>
      <td class="num">{{ number_format($fraisInscription, 0, ',', ' ') }}</td>
    </tr>
    <tr>
      <td>Mensualité{{ $moisRestants > 1 ? ' (x' . $moisRestants . ')' : '' }}</td>
      <td class="num">{{ number_format($fraisMensuel, 0, ',', ' ') }}</td>
      <td class="num">{{ number_format($montantMensualites, 0, ',', ' ') }}</td>
    </tr>
    <tr class="tot">
      <td colspan="3" class="lbl">Montant Total</td>
      <td class="num">{{ number_format($montantTotal, 0, ',', ' ') }}</td>
    </tr>
  </tbody>
</table>

<div class="mots">Arrêtée la présente facture à la somme de : <b>{{ $montantLettres }}</b></div>
<div class="compte">
  <div>Numéro de compte : SN012 01228 036210365801 81</div>
  <div class="ninea">NENEA : 23813252S2</div>
</div>

<table class="sign-table"><tr><td>
  La Comptabilité
  <div class="sign-space"></div>
</td></tr></table>

<div class="yellow-bar">TÉL : (+221) 33 825 62 10 &nbsp;—&nbsp; Site web : www.isisuptech.com</div>
<div class="footer-addr">Allées Khalifa Ababacar SY — Liberté 3 N°1977 — B.P. 47 226 — Dakar, Sénégal</div>

</body>
</html>
