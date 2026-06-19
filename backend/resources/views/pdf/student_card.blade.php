<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
@page { margin:0pt; padding:0pt; size:245pt 155pt; }
* { margin:0pt; padding:0pt; box-sizing:border-box; }
html, body { margin:0pt; padding:0pt; width:245pt; height:155pt; font-family:'DejaVu Sans', sans-serif; font-size:0; }

/* ══ Table maîtresse — largeurs absolues totalisant exactement 245pt ══ */
.master {
  width:245pt;
  border-collapse:collapse;
  table-layout:fixed;
}

/* ─── HEADER ─────────────────────────────────────────────── */
.h-bar   { width:4pt;   background:#C9A84C; padding:0; }
.h-logo  { width:28pt;  padding:5pt 2pt 4pt 6pt; vertical-align:middle; }
.h-name  { width:123pt; padding:5pt 3pt 4pt 3pt;  vertical-align:middle; overflow:hidden; }
.h-right { width:90pt;  padding:5pt 8pt 4pt 3pt;  vertical-align:middle; text-align:right; }

.h-logo img  { width:22pt; height:22pt; display:block; }
.school-name { font-size:8pt;   font-weight:900; color:#0f2352; letter-spacing:.5pt; }
.school-sub  { font-size:3.5pt; color:#94a3b8;  margin-top:1.5pt; }
.carte-lbl   { font-size:6pt;   font-weight:900; color:#C9A84C; text-transform:uppercase; letter-spacing:.4pt; }
.carte-year  { font-size:4.5pt; color:#94a3b8;  margin-top:1.5pt; }

/* ─── LIGNE OR ─────────────────────────────────────────── */
.gold-line td { height:1.5pt; background:#C9A84C; padding:0; font-size:0; line-height:0; }

/* ─── CORPS ─────────────────────────────────────────────── */
.b-bar   { width:4pt;   background:#C9A84C; padding:0; }
.b-photo { width:64pt;  padding:7pt 4pt 7pt 6pt; vertical-align:middle; }
.b-info  { width:113pt; padding:7pt 5pt; vertical-align:middle; overflow:hidden; }
.b-qr    { width:64pt;  padding:7pt 8pt 7pt 4pt;  vertical-align:middle; text-align:center; }

/* Photo carrée – cadre or */
.ph-frame { width:48pt; height:48pt; background:#C9A84C; border-radius:3pt; padding:1.5pt; }
.ph-inner { width:45pt; height:45pt; background:#dde8f8; border-radius:2pt; overflow:hidden; }
.ph-inner img  { width:45pt; height:45pt; display:block; }
.ph-init { width:45pt; height:45pt; text-align:center; line-height:45pt; font-size:17pt; font-weight:900; color:#0f2352; }

/* Infos étudiant */
.s-name { font-size:10pt; font-weight:900; color:#0f2352; line-height:1.2; letter-spacing:.1pt; }
.s-mat  { font-size:6pt;  font-weight:700; color:#C9A84C; letter-spacing:1.2pt; font-family:monospace; margin-top:2.5pt; }
.s-sep  { height:1pt; background:rgba(201,168,76,.35); margin:4pt 0; }
.i-row  { margin-bottom:3pt; }
.i-lbl  { font-size:3.5pt; color:#94a3b8; text-transform:uppercase; letter-spacing:.5pt; }
.i-val  { font-size:7pt;   font-weight:700; color:#0f2352; margin-top:1pt; }

/* QR – cadre or, intérieur blanc */
.qr-frame { width:50pt; height:50pt; background:#C9A84C; border-radius:3pt; padding:1.5pt; display:inline-block; }
.qr-inner { width:47pt; height:47pt; background:#ffffff; border-radius:2pt; overflow:hidden; }
.qr-inner img { width:47pt; height:47pt; display:block; }
.qr-lbl { font-size:3.5pt; color:#94a3b8; margin-top:2pt; text-transform:uppercase; letter-spacing:.3pt; }

/* ─── FOOTER ─────────────────────────────────────────────── */
.f-bar   { width:4pt;   background:#C9A84C; padding:0; }
.f-left  { width:151pt; padding:4pt 4pt 4pt 6pt; vertical-align:middle; }
.f-right { width:90pt;  padding:4pt 8pt 4pt 4pt;  vertical-align:middle; text-align:right; }
.f-lbl   { font-size:3.5pt; color:#94a3b8; text-transform:uppercase; letter-spacing:.5pt; }
.f-no    { font-size:7pt;   font-weight:700; color:#C9A84C; font-family:monospace; letter-spacing:.8pt; margin-top:1pt; }
.f-brand { font-size:3.5pt; color:#94a3b8; text-transform:uppercase; letter-spacing:.3pt; }
.f-site  { font-size:3pt;   color:#C9A84C;  margin-top:1pt; opacity:.6; }
</style>
</head>
<body>

  <table class="master">

    {{-- ══ HEADER : barre or (4) + logo (28) + nom (123) + right (90) = 245 ══ --}}
    <tr>
      <td class="h-bar"></td>
      <td class="h-logo"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
      <td class="h-name">
        <div class="school-name">ISI SUPTECH</div>
        <div class="school-sub">Institut Supérieur d'Informatique &amp; Technologies</div>
      </td>
      <td class="h-right">
        <div class="carte-lbl">Carte Étudiante</div>
        <div class="carte-year">{{ $student->annee_scolaire ?? date('Y').'-'.(date('Y')+1) }}</div>
      </td>
    </tr>

    {{-- ══ LIGNE OR ══ --}}
    <tr class="gold-line"><td colspan="4"></td></tr>

    {{-- ══ CORPS : barre or (4) + photo (64) + info (113) + qr (64) = 245 ══ --}}
    <tr>
      <td class="b-bar"></td>

      {{-- Photo --}}
      <td class="b-photo">
        <div class="ph-frame">
          <div class="ph-inner">
            @if(!empty($photoBase64))
              <img src="{{ $photoBase64 }}" alt="Photo"/>
            @else
              <div class="ph-init">{{ strtoupper(substr($student->prenom??'?',0,1)) }}{{ strtoupper(substr($student->nom??'?',0,1)) }}</div>
            @endif
          </div>
        </div>
      </td>

      {{-- Infos --}}
      <td class="b-info">
        <div class="s-name">{{ strtoupper($student->nom ?? '') }}<br>{{ $student->prenom ?? '' }}</div>
        <div class="s-mat">{{ $student->matricule ?? '—' }}</div>
        <div class="s-sep"></div>
        <div class="i-row">
          <div class="i-lbl">Filière</div>
          <div class="i-val">{{ $student->filiere?->nom ?? '—' }}</div>
        </div>
        <div class="i-row">
          <div class="i-lbl">Niveau</div>
          <div class="i-val">{{ $student->license?->nom ?? '—' }}</div>
        </div>
      </td>

      {{-- QR --}}
      <td class="b-qr">
        <div class="qr-frame">
          <div class="qr-inner">
            <img src="data:image/png;base64,{{ $qrBase64 }}" alt="QR"/>
          </div>
        </div>
        <div class="qr-lbl">Scanner pour vérifier</div>
      </td>

    </tr>

    {{-- ══ LIGNE OR ══ --}}
    <tr class="gold-line"><td colspan="4"></td></tr>

    {{-- ══ FOOTER : barre or (4) + left colspan=2 (151+113=264? non: 4+151+90=245) ══ --}}
    <tr>
      <td class="f-bar"></td>
      <td class="f-left" colspan="2">
        <div class="f-lbl">Numéro de carte</div>
        <div class="f-no">{{ $student->card?->numero_carte ?? ('ISI-'.date('Y').'-'.str_pad($student->id,6,'0',STR_PAD_LEFT)) }}</div>
      </td>
      <td class="f-right">
        <div class="f-brand">Multi Brain Tech</div>
        <div class="f-site">www.isisuptech.com</div>
      </td>
    </tr>

  </table>

</body>
</html>
