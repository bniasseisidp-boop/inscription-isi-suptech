@php
$moduleIndex = 0;
$semNumero = is_object($semestre) ? ($semestre->numero ?? $semestre->numero_global ?? 1) : (is_array($semestre) ? ($semestre['numero'] ?? 1) : 1);
$semAnnee = is_object($semestre) ? ($semestre->annee ?? 1) : (is_array($semestre) ? ($semestre['annee'] ?? 1) : 1);
$semGlob = is_object($semestre) ? ($semestre->numero_global ?? $semNumero) : (is_array($semestre) ? ($semestre['numero_global'] ?? $semNumero) : $semNumero);
$modulesList = $bulletin['modules'] ?? [];
$creditsObtenus = isset($bulletin['credits_obtenus']) ? floatval($bulletin['credits_obtenus']) : (isset($bulletin['total_credits']) ? floatval($bulletin['total_credits']) : 0);
$creditsRequis = isset($bulletin['credits_requis']) ? intval($bulletin['credits_requis']) : 30;
$moyenneGenerale = isset($bulletin['moyenne_generale']) && $bulletin['moyenne_generale'] !== null ? floatval($bulletin['moyenne_generale']) : (isset($bulletin['moyenne']) && $bulletin['moyenne'] !== null ? floatval($bulletin['moyenne']) : null);
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:9px; color:#111827; background:#fff; padding:16px 20px; }

/* HEADER */
.hd-table { width:100%; border-collapse:collapse; border:1.5px solid #1a3a8f; margin-bottom:8px; }
.hd-table td { border:1px solid #1a3a8f; padding:5px 8px; vertical-align:middle; }
.hd-logo-cell { width:100px; text-align:center; }
.hd-logo-cell img { width:70px; }
.hd-info-cell { font-size:9px; }
.hd-info-cell .row { margin-bottom:2px; }
.hd-info-cell .lbl { color:#334155; }
.hd-info-cell .val { font-weight:700; }
.hd-title-cell { width:150px; background:#1a3a8f; text-align:center; vertical-align:middle; }
.hd-title-cell .t1 { color:#fff; font-size:10px; font-weight:700; }
.hd-title-cell .t2 { color:#fff; font-size:13px; font-weight:900; margin-top:2px; }

/* DOMAINE / MENTION / SPECIALITE / GRADE */
.meta-table { width:100%; border-collapse:collapse; border:1.5px solid #1a3a8f; margin-bottom:8px; }
.meta-table td { border:1px solid #1a3a8f; padding:6px 8px; text-align:center; }
.meta-table .lbl { font-size:8px; text-decoration:underline; color:#334155; }
.meta-table .val { font-size:9.5px; font-weight:700; margin-top:2px; }

/* MAIN TABLE */
.notes-table { width:100%; border-collapse:collapse; margin-bottom:8px; }
.notes-table th { background:#1a3a8f; color:#fff; font-size:7.5px; text-transform:uppercase; padding:5px 4px; border:1px solid #1a3a8f; text-align:center; }
.notes-table td { border:1px solid #94a3b8; padding:3px 5px; font-size:8.5px; vertical-align:middle; }
.notes-table .ue-code { font-weight:900; color:#1a3a8f; font-size:8px; }
.notes-table .num { text-align:center; }
.notes-table .appr { text-align:center; font-size:8px; }
.notes-table .sub-row td { background:#e2e8f0; font-weight:900; }
.notes-table .sub-row .valide { color:#fff; background:#1a3a8f; border-radius:4px; padding:2px 6px; }
.notes-table .sub-row .invalide { color:#fff; background:#b91c1c; border-radius:4px; padding:2px 6px; }

/* TOTAUX */
.totaux-table { width:100%; border-collapse:collapse; margin-bottom:6px; }
.totaux-table td { border:1.5px solid #1a3a8f; padding:6px 10px; font-size:9.5px; }
.totaux-table .lbl { color:#334155; }
.totaux-table .val { font-weight:900; text-align:right; font-size:11px; color:#1a3a8f; }

.conseil { border:1px solid #94a3b8; padding:6px 10px; font-size:9px; margin-bottom:10px; }
.conseil b { color:#1a3a8f; }

/* RECAP */
.recap-title { font-size:8.5px; font-weight:900; margin-bottom:2px; }
.recap-table { width:100%; border-collapse:collapse; margin-bottom:10px; }
.recap-table th, .recap-table td { border:1px solid #94a3b8; padding:4px 6px; text-align:center; font-size:8px; }
.recap-table th { background:#f1f5f9; font-weight:900; }
.recap-table .valide { color:#1a3a8f; font-weight:700; }
.recap-table .invalide { color:#b91c1c; font-weight:700; }

/* LEGENDE */
.legende { border:1px solid #cbd5e1; padding:5px 8px; font-size:6.5px; color:#475569; margin-bottom:14px; }
.legende b { color:#1a1a2e; }
.legende .swatch { display:inline-block; width:7px; height:7px; margin-right:2px; }

/* SIGNATURE */
.bot-table { width:100%; border-collapse:collapse; }
.bot-table td { vertical-align:bottom; font-size:8px; }
.bot-table .date { color:#475569; }
.bot-table .sig { text-align:right; }
.bot-table .sig .role { font-weight:700; color:#1a1a2e; }
.bot-table .sig .nom { font-weight:900; color:#1a3a8f; }
.qr-cell { width:60px; text-align:center; }
.qr-cell img { width:48px; height:48px; }
</style>
</head>
<body>

{{-- HEADER --}}
<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-info-cell">
    <div class="row"><span class="lbl">Année académique : </span><span class="val">{{ $anneeScolaire }}</span></div>
    <div class="row"><span class="lbl">Matricule : </span><span class="val">{{ $student->matricule ?? '—' }}/ISI SUPTECH</span></div>
    <div class="row"><span class="lbl">Prénom et nom : </span><span class="val">{{ $student->prenom }} {{ strtoupper($student->nom) }}</span></div>
    <div class="row"><span class="lbl">Sexe : </span><span class="val">{{ $student->sexe === 'F' ? 'Féminin' : 'Masculin' }}</span></div>
    <div class="row"><span class="lbl">Date et lieu de naissance : </span><span class="val">{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }} à {{ $student->lieu_naissance ?? '—' }}</span></div>
  </td>
  <td class="hd-title-cell">
    <div class="t1">Bulletin de notes</div>
    <div class="t2">Semestre {{ $semGlob }}</div>
  </td>
</tr></table>

{{-- DOMAINE / MENTION / SPECIALITE / GRADE --}}
<table class="meta-table"><tr>
  <td><div class="lbl">Domaine</div><div class="val">{{ $domaine ?? 'Sciences et Technologies' }}</div></td>
  <td><div class="lbl">Mention</div><div class="val">{{ $mentionFiliere ?? 'Informatique' }}</div></td>
  <td><div class="lbl">Spécialité</div><div class="val">{{ $student->filiere?->nom ?? '—' }}</div></td>
  <td><div class="lbl">Grade</div><div class="val">{{ $grade ?? 'Licence' }}</div></td>
</tr></table>

{{-- TABLEAU DES NOTES --}}
<table class="notes-table">
  <thead><tr>
    <th style="width:13%;">UE</th>
    <th style="width:23%;">Éléments constitutifs</th>
    <th style="width:8%;">MCC 40%</th>
    <th style="width:8%;">Examen 60%</th>
    <th style="width:8%;">Moy EC</th>
    <th style="width:7%;">Coef EC</th>
    <th style="width:9%;">Moyenne Coef</th>
    <th style="width:7%;">Crédit EC</th>
    <th style="width:8%;">Moyenne UE</th>
    <th style="width:9%;">Appréciation</th>
  </tr></thead>
  <tbody>
    @foreach($modulesList as $modDetail)
      @php
        $moduleIndex++;
        $modObj = $modDetail['module'] ?? null;
        $modCode = is_object($modObj) ? ($modObj->code ?? $modObj->nom ?? '') : (is_array($modObj) ? ($modObj['code'] ?? $modObj['nom'] ?? '') : ($modDetail['code'] ?? $modDetail['ue_nom'] ?? $modDetail['nom'] ?? ''));
        $modNom = is_object($modObj) ? ($modObj->nom ?? '') : (is_array($modObj) ? ($modObj['nom'] ?? '') : ($modDetail['nom'] ?? $modDetail['ue_nom'] ?? ''));
        $modCredits = is_object($modObj) ? floatval($modObj->credits ?? 6) : (is_array($modObj) ? floatval($modObj['credits'] ?? 6) : floatval($modDetail['credits'] ?? $modDetail['ue_credits'] ?? 6));
        $ueCode = 'UE' . $semNumero . '.' . $semAnnee . '.' . $moduleIndex;

        $lignes = $modDetail['lignes'] ?? $modDetail['matieres'] ?? [];
        $totMoyCoef = isset($modDetail['total_moyenne_coef']) ? floatval($modDetail['total_moyenne_coef']) : (isset($modDetail['total_moyenne_ponderee']) ? floatval($modDetail['total_moyenne_ponderee']) : null);
        $moyUe = isset($modDetail['moyenne_ue']) && $modDetail['moyenne_ue'] !== null ? floatval($modDetail['moyenne_ue']) : (isset($modDetail['moy_ue']) && $modDetail['moy_ue'] !== null ? floatval($modDetail['moy_ue']) : (isset($modDetail['moyenne']) && $modDetail['moyenne'] !== null ? floatval($modDetail['moyenne']) : null));
        $valide = isset($modDetail['valide']) ? (bool)$modDetail['valide'] : ($moyUe !== null && $moyUe >= 10.0);
      @endphp
      @foreach($lignes as $i => $ligne)
        @php
          $matObj = $ligne['matiere'] ?? null;
          $matNom = is_object($matObj) ? ($matObj->nom ?? '') : (is_array($matObj) ? ($matObj['nom'] ?? '') : ($matObj ?: ($ligne['nom'] ?? 'Matière')));
          $matCoef = is_object($matObj) ? floatval($matObj->coef ?? 1) : (is_array($matObj) ? floatval($matObj['coef'] ?? $matObj['coeff'] ?? 1) : floatval($ligne['coeff'] ?? $ligne['coef'] ?? 1));
          $matCredits = is_object($matObj) ? floatval($matObj->credits ?? 2) : (is_array($matObj) ? floatval($matObj['credits'] ?? 2) : floatval($ligne['credits'] ?? 2));
          
          $mcc = isset($ligne['mcc']) && $ligne['mcc'] !== null && $ligne['mcc'] !== '' ? floatval($ligne['mcc']) : (isset($ligne['cc']) && $ligne['cc'] !== null && $ligne['cc'] !== '' ? floatval($ligne['cc']) : (isset($ligne['moy_cont']) && $ligne['moy_cont'] !== null && $ligne['moy_cont'] !== '' ? floatval($ligne['moy_cont']) : null));
          $exam = isset($ligne['examen']) && $ligne['examen'] !== null && $ligne['examen'] !== '' ? floatval($ligne['examen']) : (isset($ligne['exam']) && $ligne['exam'] !== null && $ligne['exam'] !== '' ? floatval($ligne['exam']) : (isset($ligne['compo']) && $ligne['compo'] !== null && $ligne['compo'] !== '' ? floatval($ligne['compo']) : null));
          $moyEc = isset($ligne['moyenne_ec']) && $ligne['moyenne_ec'] !== null && $ligne['moyenne_ec'] !== '' ? floatval($ligne['moyenne_ec']) : (isset($ligne['moyenne']) && $ligne['moyenne'] !== null && $ligne['moyenne'] !== '' ? floatval($ligne['moyenne']) : (isset($ligne['moy']) && $ligne['moy'] !== null && $ligne['moy'] !== '' ? floatval($ligne['moy']) : (($mcc !== null && $exam !== null) ? round(($mcc * 0.4) + ($exam * 0.6), 2) : null)));
          $moyCoef = isset($ligne['moyenne_coef']) && $ligne['moyenne_coef'] !== null && $ligne['moyenne_coef'] !== '' ? floatval($ligne['moyenne_coef']) : ($moyEc !== null ? round($moyEc * $matCoef, 2) : null);
          $appr = $ligne['appreciation'] ?? ($moyEc !== null ? ($moyEc >= 16 ? 'Très Bien' : ($moyEc >= 14 ? 'Bien' : ($moyEc >= 12 ? 'Assez Bien' : ($moyEc >= 10 ? 'Passable' : 'Insuffisant')))) : '—');
        @endphp
        <tr>
          <td class="ue-code">@if($i === 0){{ $ueCode }} {{ $modCode }}@endif</td>
          <td>{{ $matNom }}</td>
          <td class="num">{{ $mcc !== null ? number_format($mcc, 2, ',', '') : '—' }}</td>
          <td class="num">{{ $exam !== null ? number_format($exam, 2, ',', '') : '—' }}</td>
          <td class="num">{{ $moyEc !== null ? number_format($moyEc, 2, ',', '') : '—' }}</td>
          <td class="num">{{ number_format($matCoef, 2, ',', '') }}</td>
          <td class="num">{{ $moyCoef !== null ? number_format($moyCoef, 2, ',', '') : '—' }}</td>
          <td class="num">{{ number_format($matCredits, 1, ',', '') }}</td>
          <td></td>
          <td class="appr">{{ $appr }}</td>
        </tr>
      @endforeach
      <tr class="sub-row">
        <td colspan="6"></td>
        <td class="num">{{ $totMoyCoef !== null ? number_format($totMoyCoef, 2, ',', '') : '—' }}</td>
        <td class="num">{{ number_format($modCredits, 2, ',', '') }}</td>
        <td class="num">{{ $moyUe !== null ? number_format($moyUe, 2, ',', '') : '—' }}</td>
        <td class="appr">
          @if($moyUe !== null)
            <span class="{{ $valide ? 'valide' : 'invalide' }}">{{ $valide ? 'Validée' : 'Invalidée' }}</span>
          @else — @endif
        </td>
      </tr>
    @endforeach
  </tbody>
</table>

{{-- TOTAUX --}}
<table class="totaux-table"><tr>
  <td class="lbl" style="width:70%;">Total crédits obtenus :</td>
  <td class="val">{{ number_format($creditsObtenus, 2, ',', '') }} / {{ $creditsRequis }}</td>
</tr>
<tr>
  <td class="lbl">Moyenne du semestre :</td>
  <td class="val">{{ $moyenneGenerale !== null ? number_format($moyenneGenerale, 2, ',', '') : '—' }} / 20</td>
</tr></table>

<div class="conseil"><b>Appréciation conseil de classe :</b> {{ $appreciationConseil ?: '—' }}</div>

{{-- RECAPITULATIF DES UNITES --}}
<div class="recap-title">Récapitulatifs des unités</div>
<table class="recap-table">
  <thead><tr><th></th>@foreach($modulesList as $i => $m)<th>UE {{ $i + 1 }}</th>@endforeach</tr></thead>
  <tbody>
    <tr><td style="text-align:left;">Moyennes</td>
      @foreach($modulesList as $m)
        @php
          $mAvg = isset($m['moyenne_ue']) && $m['moyenne_ue'] !== null ? floatval($m['moyenne_ue']) : (isset($m['moy_ue']) && $m['moy_ue'] !== null ? floatval($m['moy_ue']) : (isset($m['moyenne']) && $m['moyenne'] !== null ? floatval($m['moyenne']) : null));
        @endphp
        <td>{{ $mAvg !== null ? number_format($mAvg, 2, ',', '') : '—' }}</td>
      @endforeach
    </tr>
    <tr><td style="text-align:left;">Validations</td>
      @foreach($modulesList as $m)
        @php
          $mAvg = isset($m['moyenne_ue']) && $m['moyenne_ue'] !== null ? floatval($m['moyenne_ue']) : (isset($m['moy_ue']) && $m['moy_ue'] !== null ? floatval($m['moy_ue']) : (isset($m['moyenne']) && $m['moyenne'] !== null ? floatval($m['moyenne']) : null));
          $mVal = isset($m['valide']) ? (bool)$m['valide'] : ($mAvg !== null && $mAvg >= 10.0);
        @endphp
        <td class="{{ $mVal ? 'valide' : 'invalide' }}">{{ $mAvg !== null ? ($mVal ? 'Validée' : 'Invalidée') : '—' }}</td>
      @endforeach
    </tr>
    <tr><td style="text-align:left;">Crédits obtenus</td>
      @foreach($modulesList as $m)
        @php
          $mCredits = is_object($m['module'] ?? null) ? floatval($m['module']->credits ?? 6) : (is_array($m['module'] ?? null) ? floatval($m['module']['credits'] ?? 6) : floatval($m['credits'] ?? $m['ue_credits'] ?? 6));
          $mAvg = isset($m['moyenne_ue']) && $m['moyenne_ue'] !== null ? floatval($m['moyenne_ue']) : (isset($m['moy_ue']) && $m['moy_ue'] !== null ? floatval($m['moy_ue']) : (isset($m['moyenne']) && $m['moyenne'] !== null ? floatval($m['moyenne']) : null));
          $mVal = isset($m['valide']) ? (bool)$m['valide'] : ($mAvg !== null && $mAvg >= 10.0);
        @endphp
        <td>{{ $mVal ? number_format($mCredits, 2, ',', '') : '0,00' }}</td>
      @endforeach
    </tr>
  </tbody>
</table>

<div class="legende">
  <b>MCC</b> = Moyenne contrôles continus &nbsp;•&nbsp; <b>EC</b> = Élément constitutif &nbsp;•&nbsp; <b>Moy</b> = Moyenne &nbsp;•&nbsp;
  <span class="swatch" style="background:#1a3a8f;"></span> UE validée &nbsp;•&nbsp; <span class="swatch" style="background:#b91c1c;"></span> UE invalidée
</div>

{{-- SIGNATURE --}}
<table class="bot-table"><tr>
  <td class="qr-cell">@if(!empty($qrBase64))<img src="data:image/png;base64,{{ $qrBase64 }}" alt="QR"/>@endif</td>
  <td class="date">Le : {{ now()->format('d/m/Y') }}</td>
  <td class="sig">
    <div class="role">Directeur des Études</div>
    <div class="nom">Serigne M. Kara SAMB</div>
  </td>
</tr></table>

</body>
</html>
