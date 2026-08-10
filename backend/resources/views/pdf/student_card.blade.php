<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { margin:0pt; padding:0pt; size:245pt 155pt; }
* { margin:0pt; padding:0pt; box-sizing:border-box; }
html, body { margin:0pt; padding:0pt; width:245pt; font-family:'DejaVu Sans', sans-serif; font-size:0; }

.back { page-break-before: always; }

/* Table maîtresse : UNE seule colonne pleine largeur par ligne (colspan
   implicite via une seule td) — chaque ligne qui a besoin d'une répartition
   gauche/droite utilise sa PROPRE table imbriquée avec sa propre largeur de
   colonnes, pour éviter que table-layout:fixed n'hérite les largeurs de
   colonnes d'une ligne précédente ayant un nombre de cellules différent
   (c'est ce qui décalait la photo et le pied de page auparavant). */
.master { width:245pt; border-collapse:collapse; table-layout:fixed; }
.master > tbody > tr > td { padding:0; }
.row2 { width:245pt; border-collapse:collapse; table-layout:fixed; }

/* ── RECTO ─────────────────────────────────────────────────────────── */
.f-head-l { width:159pt; vertical-align:middle; padding:5pt 4pt 2pt 6pt; }
.f-head-r { width:86pt;  vertical-align:middle; padding:5pt 6pt 2pt 4pt; text-align:right; }
.f-logo   { display:inline-block; width:22pt; vertical-align:middle; }
.f-logo img { width:22pt; height:22pt; display:block; }
.f-school   { display:inline-block; vertical-align:middle; margin-left:4pt; }
.f-school .name { font-size:8pt; font-weight:900; color:#0f2352; letter-spacing:.3pt; line-height:1.1; }
.f-school .sub  { font-size:3.4pt; color:#475569; line-height:1.2; margin-top:1pt; }
.f-carte .lbl  { font-size:5pt; font-weight:900; color:#0f2352; line-height:1.1; }
.f-carte .year { font-size:4.3pt; color:#334155; margin-top:1pt; line-height:1; }

.f-divider { height:1.4pt; background:#7a1f2b; font-size:0; line-height:0; }
.f-divider2 { height:1pt; background:#0f2352; font-size:0; line-height:0; }

.f-fil { padding:3pt 6pt 1pt 6pt; }
.f-fil .txt { font-size:6.3pt; font-weight:900; color:#111827; letter-spacing:.2pt; }

.f-info  { width:150pt; vertical-align:top; padding:2pt 4pt 3pt 6pt; }
.f-photo { width:95pt;  vertical-align:top; padding:2pt 6pt 3pt 4pt; text-align:right; }

.f-code { font-size:5.3pt; font-weight:700; color:#7a1f2b; font-family:monospace; margin-bottom:2pt; }
.f-name { font-size:7.6pt; font-weight:900; color:#111827; line-height:1.15; margin-bottom:2pt; }
.f-ref  { font-size:4.6pt; color:#111827; font-family:monospace; margin-bottom:3pt; line-height:1.3; }
.f-row  { font-size:4.8pt; color:#111827; line-height:1.5; }
.f-row b { color:#0f2352; }

.f-photobox { width:52pt; height:54pt; margin-left:auto; background:#0f2352; padding:1.5pt; border-radius:2pt; }
.f-photoin  { width:49pt; height:51pt; background:#dbeafe; overflow:hidden; }
.f-photoin img { width:49pt; height:51pt; display:block; }
.f-photoin .init { width:49pt; height:51pt; text-align:center; line-height:51pt; font-size:14pt; font-weight:900; color:#0f2352; }

.f-foot-l { width:122.5pt; background:#1d2a6b; padding:3pt 6pt; vertical-align:middle; }
.f-foot-r { width:122.5pt; background:#1d2a6b; padding:3pt 6pt; vertical-align:middle; border-left:0.5pt solid rgba(255,255,255,0.25); }
.f-foot .txt { font-size:4.3pt; color:#ffffff; line-height:1.5; }

/* ── VERSO ─────────────────────────────────────────────────────────── */
.b-top-l { width:122pt; padding:6pt 8pt 2pt 8pt; vertical-align:middle; }
.b-top-r { width:123pt; padding:6pt 8pt 2pt 8pt; vertical-align:middle; text-align:right; }
.b-top .lbl { font-size:4.6pt; color:#111827; font-weight:700; }
.b-top .val { font-size:4.6pt; color:#111827; font-weight:700; }

.b-title { padding:2pt 8pt 4pt 8pt; }
.b-title .txt { font-size:5.8pt; font-weight:900; color:#0f2352; letter-spacing:.2pt; }

.b-barcode { width:171pt; vertical-align:middle; padding:0pt 4pt 0pt 8pt; }
.b-qr      { width:74pt;  vertical-align:middle; padding:0pt 8pt 0pt 4pt; text-align:right; }
.b-qr img  { width:44pt; height:44pt; }

.barwrap { white-space:nowrap; font-size:0; line-height:0; height:30pt; width:155pt; overflow:hidden; }
.bar     { display:inline-block; height:30pt; background:#000000; }
.spc     { display:inline-block; height:30pt; background:#ffffff; }

.b-ref { padding:2pt 8pt 0 8pt; text-align:center; }
.b-ref .txt { font-size:4.8pt; color:#111827; font-family:monospace; letter-spacing:.3pt; }

.b-foot-l { width:122pt; padding:5pt 8pt 6pt 8pt; vertical-align:middle; }
.b-foot-r { width:123pt; padding:5pt 8pt 6pt 8pt; vertical-align:middle; text-align:right; }
.b-foot .code { font-size:4.6pt; color:#111827; font-family:monospace; font-weight:700; }
.b-foot .brand { font-size:3.2pt; color:#94a3b8; text-transform:uppercase; letter-spacing:.3pt; }
</style>
</head>
<body>

{{-- ══════════════════════════════ RECTO ══════════════════════════════ --}}
<table class="master"><tbody>
  <tr><td>
    <table class="row2"><tr>
      <td class="f-head-l">
        <span class="f-logo"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></span>
        <span class="f-school">
          <div class="name">ISI SUPTECH</div>
          <div class="sub">Institut Supérieur d'Informatique</div>
        </span>
      </td>
      <td class="f-head-r f-carte">
        <div class="lbl">Carte d'apprenant</div>
        <div class="year">{{ $student->annee_scolaire ?? (date('Y').'-'.(date('Y')+1)) }}</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="f-divider"></td></tr>
  <tr><td class="f-divider2"></td></tr>

  <tr><td class="f-fil"><span class="txt">{{ $student->filiere?->nom ?? '—' }}</span></td></tr>

  <tr><td>
    <table class="row2"><tr>
      <td class="f-info">
        <div class="f-code">{{ $student->license?->code ?? $student->filiere?->code ?? '—' }}</div>
        <div class="f-name">{{ $student->prenom ?? '' }} {{ strtoupper($student->nom ?? '') }}</div>
        <div class="f-ref">{{ $refCarte }}</div>
        <div class="f-row">Né(e) le : <b>{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</b></div>
        <div class="f-row">A : <b>{{ $student->lieu_naissance ?? '—' }}</b></div>
      </td>
      <td class="f-photo">
        <div class="f-photobox">
          <div class="f-photoin">
            @if(!empty($photoBase64))
              <img src="{{ $photoBase64 }}" alt="Photo"/>
            @else
              <div class="init">{{ strtoupper(substr($student->prenom??'?',0,1)) }}{{ strtoupper(substr($student->nom??'?',0,1)) }}</div>
            @endif
          </div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td>
    <table class="row2 f-foot"><tr>
      <td class="f-foot-l"><div class="txt">Dakar<br>Tél : 77 978 26 18</div></td>
      <td class="f-foot-r"><div class="txt">E-mail : contact@isisuptech.com<br>Site web : www.isisuptech.com</div></td>
    </tr></table>
  </td></tr>
</tbody></table>

{{-- ══════════════════════════════ VERSO ══════════════════════════════ --}}
<table class="master back"><tbody>
  <tr><td>
    <table class="row2 b-top"><tr>
      <td class="b-top-l"><span class="lbl">Tél :</span></td>
      <td class="b-top-r"><span class="val">{{ $student->telephone ?? '—' }}</span></td>
    </tr></table>
  </td></tr>

  <tr><td class="b-title"><span class="txt">Contrôle par code barre</span></td></tr>

  <tr><td>
    <table class="row2"><tr>
      <td class="b-barcode">
        <div class="barwrap">
          @foreach($barcodeSegments as $seg)
            <div class="{{ $seg['black'] ? 'bar' : 'spc' }}" style="width:{{ $seg['pt'] }}pt;"></div>
          @endforeach
        </div>
      </td>
      <td class="b-qr"><img src="data:image/png;base64,{{ $qrBase64 }}" alt="QR"/></td>
    </tr></table>
  </td></tr>

  <tr><td class="b-ref"><span class="txt">{{ $refCarte }}</span></td></tr>

  <tr><td>
    <table class="row2 b-foot"><tr>
      <td class="b-foot-l"><span class="code">{{ $codeBas }}</span></td>
      <td class="b-foot-r"><span class="brand">ISI SUPTECH · Multi Brain Tech</span></td>
    </tr></table>
  </td></tr>
</tbody></table>

</body>
</html>
