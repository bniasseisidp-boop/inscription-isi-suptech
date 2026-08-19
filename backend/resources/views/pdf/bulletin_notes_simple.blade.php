@php
$moyenneSemestre = $detail['moyenne_semestre'];
$appreciationBoxes = ['Félicitations', 'Encouragements', "Tableau d'honneur", 'Avertissement', 'Blâme'];
$boxCochee = match (true) {
    $moyenneSemestre === null => null,
    $moyenneSemestre >= 16 => 'Félicitations',
    $moyenneSemestre >= 12 => 'Encouragements',
    $moyenneSemestre >= 10 => "Tableau d'honneur",
    $moyenneSemestre >= 8  => 'Avertissement',
    default => 'Blâme',
};
$numeroLabel = $semestre->numero == 1 ? '1er' : '2ème';
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:10px; color:#111827; padding:22px 26px; }

.header { text-align:center; margin-bottom:14px; }
.header img { width:56px; margin-bottom:4px; }
.header .etab { font-size:11px; color:#334155; }
.titre { text-align:center; font-size:20px; font-weight:900; color:#1a3a8f; font-style:italic; margin:14px 0 18px; }

.boxes { display:table; width:100%; margin-bottom:14px; }
.box-cell { display:table-cell; width:50%; vertical-align:top; padding:0 6px; }
.box { border:1.5px solid #1a3a8f; border-radius:6px; padding:10px 14px; font-size:10px; }
.box .row { margin-bottom:5px; }
.box .lbl { color:#334155; }
.box .val { font-weight:700; }

table.notes { width:100%; border-collapse:collapse; margin-bottom:10px; }
table.notes th { background:#1a3a8f; color:#fff; font-size:8.5px; padding:6px 5px; border:1px solid #1a3a8f; text-align:center; }
table.notes td { border:1px solid #94a3b8; padding:5px; font-size:9px; text-align:center; }
table.notes td.mat { text-align:left; }
table.notes tr.total td { background:#e2e8f0; font-weight:900; }

.moyenne-row { display:table; width:100%; margin-bottom:14px; }
.moyenne-row .lbl { display:table-cell; font-size:13px; font-weight:900; }
.moyenne-row .val { display:table-cell; text-align:right; font-size:15px; font-weight:900; color:#1a3a8f; }

.appreciations { border:1.5px solid #1a3a8f; border-radius:6px; padding:10px 14px; margin-bottom:12px; }
.appreciations .titre-appr { font-weight:900; color:#1a3a8f; font-size:9.5px; margin-bottom:8px; }
.appreciations .infos { display:table; width:100%; margin-bottom:8px; }
.appreciations .infos .c { display:table-cell; font-size:9.5px; }
.appreciations .conseil { font-size:9.5px; margin-bottom:8px; }
.appreciations .boites { display:table; width:100%; }
.appreciations .boite { display:table-cell; text-align:center; font-size:8.5px; }
.appreciations .carre { display:inline-block; width:9px; height:9px; border:1px solid #334155; margin-right:3px; vertical-align:middle; }
.appreciations .carre.on { background:#1a3a8f; border-color:#1a3a8f; }
.appreciations .boite.on span.txt { font-weight:900; color:#1a3a8f; }

.bas { display:table; width:100%; margin-top:16px; }
.bas .g { display:table-cell; width:60px; vertical-align:bottom; }
.bas .g img { width:52px; height:52px; }
.bas .d { display:table-cell; text-align:right; vertical-align:bottom; font-size:9.5px; }
.bas .d .role { font-weight:700; }
.bas .d .nom { font-weight:900; color:#1a3a8f; }
.bas .date { display:table-cell; font-size:9px; color:#475569; vertical-align:bottom; }
</style>
</head>
<body>

<div class="header">
  <img src="{{ public_path('isi-logo.png') }}" alt="ISI SUPTECH">
  <div class="etab">Institut Supérieur d'Informatique — ISI SUPTECH</div>
</div>

<div class="titre">Bulletin du {{ $numeroLabel }} semestre</div>

<div class="boxes">
  <div class="box-cell">
    <div class="box">
      <div class="row"><span class="lbl">Année académique : </span><span class="val">{{ $anneeScolaire }}</span></div>
      <div class="row"><span class="lbl">Section : </span><span class="val">{{ $student->filiere?->nom }}</span></div>
      <div class="row"><span class="lbl">Classe : </span><span class="val">{{ $semestre->license?->nom }}</span></div>
      <div class="row"><span class="lbl">Semestre : </span><span class="val">{{ $semestre->libelle }}</span></div>
    </div>
  </div>
  <div class="box-cell">
    <div class="box">
      <div class="row"><span class="lbl">Nom : </span><span class="val">{{ strtoupper($student->nom) }}</span></div>
      <div class="row"><span class="lbl">Prénom : </span><span class="val">{{ $student->prenom }}</span></div>
      <div class="row"><span class="lbl">Naissance : </span><span class="val">{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }} à {{ $student->lieu_naissance ?? '—' }}</span></div>
      <div class="row"><span class="lbl">Matricule : </span><span class="val">{{ $student->matricule }}/ISI SUPTECH</span></div>
    </div>
  </div>
</div>

<table class="notes">
  <thead>
    <tr>
      <th style="width:26%;">Matières du semestre</th>
      <th>Moy Cont 1/2</th>
      <th>Compo 1/2</th>
      <th>Moy Géné 2/2</th>
      <th>Coef EC</th>
      <th>Moyenne Coef</th>
      <th style="width:14%;">Appréciation</th>
    </tr>
  </thead>
  <tbody>
    @foreach($detail['lignes'] as $ligne)
      <tr>
        <td class="mat">{{ $ligne['matiere']->nom }}</td>
        <td>{{ $ligne['moy_cont'] !== null ? number_format($ligne['moy_cont'], 2, ',', '') : '—' }}</td>
        <td>{{ $ligne['compo'] !== null ? number_format($ligne['compo'], 2, ',', '') : '—' }}</td>
        <td>{{ $ligne['moyenne_generale'] !== null ? number_format($ligne['moyenne_generale'], 2, ',', '') : '—' }}</td>
        <td>{{ number_format($ligne['matiere']->coef, 2, ',', '') }}</td>
        <td>{{ $ligne['moyenne_coef'] !== null ? number_format($ligne['moyenne_coef'], 2, ',', '') : '—' }}</td>
        <td>{{ $ligne['appreciation'] ?? '—' }}</td>
      </tr>
    @endforeach
    <tr class="total">
      <td colspan="4" style="text-align:right;">Total Général :</td>
      <td>{{ number_format($detail['total_coef'], 2, ',', '') }}</td>
      <td>{{ number_format($detail['total_moyenne_coef'], 2, ',', '') }}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="moyenne-row">
  <div class="lbl">Moyenne du semestre :</div>
  <div class="val">{{ $moyenneSemestre !== null ? number_format($moyenneSemestre, 2, ',', '') : '—' }} / 20</div>
</div>

<div class="appreciations">
  <div class="titre-appr">Appréciations</div>
  <div class="infos">
    <div class="c"><b>Total Absence :</b> {{ $totalAbsences }}</div>
    <div class="c"><b>Total retard :</b> —</div>
    <div class="c"><b>Rang :</b> {{ $rang ?? '—' }}</div>
  </div>
  <div class="conseil"><b>Appréciation du conseil de classe :</b> {{ $appreciationConseil ?: ($detail['mention'] ?? '—') }}</div>
  <div class="boites">
    @foreach($appreciationBoxes as $b)
      <div class="boite {{ $boxCochee === $b ? 'on' : '' }}">
        <span class="carre {{ $boxCochee === $b ? 'on' : '' }}"></span><span class="txt">{{ $b }}</span>
      </div>
    @endforeach
  </div>
</div>

<div class="bas">
  <div class="g"><img src="data:image/png;base64,{{ $qrBase64 }}" alt="QR"></div>
  <div class="date">Le : {{ now()->format('d/m/Y') }}</div>
  <div class="d">
    <div class="role">Directeur des Études</div>
    <div class="nom">Serigne M. Kara SAMB</div>
  </div>
</div>

</body>
</html>
