@php
$moisNoms = ['01'=>'Janvier','02'=>'Février','03'=>'Mars','04'=>'Avril','05'=>'Mai',
             '06'=>'Juin','07'=>'Juillet','08'=>'Août','09'=>'Septembre',
             '10'=>'Octobre','11'=>'Novembre','12'=>'Décembre'];

$license = $student->license;
$moisDebut  = intval($license?->mois_debut ?? 9);
$now        = \Carbon\Carbon::now();
// Priorité à l'année scolaire réelle de l'étudiant — sinon la référence d'inscription
// ($numInscription plus bas) tombe sur la mauvaise année avant le mois de rentrée.
if ($student->annee_scolaire && preg_match('/^(\d{4})-\d{4}$/', $student->annee_scolaire, $mAnnee)) {
    $anneeDebut = (int) $mAnnee[1];
} else {
    $anneeDebut = ($now->month >= $moisDebut) ? $now->year : $now->year - 1;
}
$anneeAcademique = $student->annee_scolaire ?? ($anneeDebut . '-' . ($anneeDebut + 1));

$fraisInscription = floatval($license?->frais_inscription ?? 0);
$fraisMensuel      = floatval($license?->frais_mensuel ?? 0);
$nbMoisAnnee       = 10;
$scolariteAnnuelle = $fraisMensuel * $nbMoisAnnee;

$fraisExamen      = floatval($siteSettings['frais_examen'] ?? 0);
$fraisSoutenance  = floatval($siteSettings['frais_soutenance'] ?? 0);
$fraisDossier     = floatval($siteSettings['frais_dossier'] ?? 70000);
$fraisUniforme    = floatval($siteSettings['frais_tenue'] ?? 60000);
$fraisAssurance   = floatval($siteSettings['frais_assurance'] ?? 10000);
$fraisAmical      = floatval($siteSettings['frais_amea'] ?? 10000);
$fraisBiblio      = floatval($siteSettings['frais_bibliotheque'] ?? 5000);
$fraisStage       = floatval($siteSettings['frais_stage'] ?? 0);

$anneeCourte    = substr((string) ($anneeDebut + 1), -2);
$licCode        = $license?->code ?? 'ISI';
$numInscription = $licCode . '-' . $anneeCourte . '-' . str_pad($student->id, 4, '0', STR_PAD_LEFT);

// Grille de paiement mensuel — 5 colonnes de 3 mois (dont un rappel Oct P/Nov P/Déc P)
$grilleColonnes = [
    [['Octobre', $fraisMensuel], ['Novembre', $fraisMensuel], ['Décembre', $fraisMensuel]],
    [['Janvier', $fraisMensuel], ['Février', $fraisMensuel],  ['Mars', $fraisMensuel]],
    [['Avril', $fraisMensuel],   ['Mai', $fraisMensuel],      ['Juin', $fraisMensuel]],
    [['Juillet', 0],             ['Août', 0],                 ['Septembre', 0]],
    [['Octobre P', 0],           ['Novembre P', 0],           ['Décembre P', 0]],
];
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DejaVu Sans',Arial,sans-serif; font-size:8px; color:#1a1a2e; background:#fff; padding:14px 18px; }

.hd-table { width:100%; border-collapse:collapse; }
.hd-logo-cell { width:70px; vertical-align:top; }
.hd-logo-cell img { width:58px; }
.hd-center-cell { text-align:center; vertical-align:middle; }
.hd-center-cell h1 { font-size:13px; font-weight:900; font-family:'DejaVu Serif',serif; }
.hd-center-cell p { font-size:7px; color:#475569; font-style:italic; margin-top:1px; }
.hd-photo-cell { width:70px; text-align:right; vertical-align:top; }
.hd-photo-cell img { width:50px; height:60px; object-fit:cover; border:1px solid #94a3b8; }
.photo-placeholder { width:50px; height:60px; border:1px dashed #94a3b8; display:inline-block; text-align:center; line-height:60px; font-size:6.5px; color:#94a3b8; }

.doc-title { text-align:center; font-size:13px; font-weight:900; letter-spacing:1px; border-top:1.5px solid #1a1a2e; border-bottom:1.5px solid #1a1a2e; padding:5px 0; margin:8px 0 10px; }

.panel { border:1px solid #64748b; border-radius:4px; margin-bottom:8px; }
.panel-title { background:#eef2f7; font-size:7.5px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; padding:3px 8px; border-bottom:1px solid #64748b; text-align:center; }
.panel-body { padding:6px 10px; }
.frow { width:100%; border-collapse:collapse; margin-bottom:3px; }
.frow td { font-size:8px; vertical-align:top; padding:1px 0; }
.frow .l { color:#475569; width:34%; }
.frow .v { font-weight:700; }

.two-col { width:100%; border-collapse:collapse; }
.two-col td { vertical-align:top; width:50%; }
.two-col .left { padding-right:6px; }
.two-col .right { padding-left:6px; }

.eng-table { width:100%; border-collapse:collapse; margin-top:2px; }
.eng-table td { font-size:7.5px; padding:1.5px 0; }
.eng-table .l { color:#475569; }
.eng-table .v { font-weight:700; text-align:right; }
.eng-table .tot td { border-top:1px solid #64748b; font-weight:900; padding-top:2px; }

.pay-note { font-size:7.5px; font-weight:700; margin:6px 0 3px; }
.pay-grid { width:100%; border-collapse:collapse; table-layout:fixed; }
.pay-grid td { border:1px solid #cbd5e1; padding:0; width:20%; vertical-align:top; }
.pay-grid .cell { border-bottom:1px solid #e2e8f0; padding:2px 5px; font-size:7px; }
.pay-grid .cell:last-child { border-bottom:none; }
.pay-grid .m { color:#475569; }
.pay-grid .v { font-weight:700; float:right; }

.reglement { font-size:6.3px; color:#334155; line-height:1.5; margin-top:8px; }
.reglement .h { font-weight:900; text-transform:uppercase; margin-bottom:2px; }
.reglement li { margin-bottom:2px; list-style:none; }

.sign-row { width:100%; border-collapse:collapse; margin-top:12px; border-top:1px solid #94a3b8; }
.sign-row td { width:25%; text-align:center; font-size:7.5px; font-weight:900; padding-top:5px; text-transform:uppercase; }
</style>
</head>
<body>

<table class="hd-table"><tr>
  <td class="hd-logo-cell"><img src="{{ public_path('isi-logo.png') }}" alt="ISI"/></td>
  <td class="hd-center-cell">
    <h1>Institut Supérieur d'Informatique</h1>
    <p>Un institut tourné vers les métiers d'avenir</p>
  </td>
  <td class="hd-photo-cell">
    @if(!empty($photoBase64))
      <img src="{{ $photoBase64 }}" alt="Photo"/>
    @else
      <div class="photo-placeholder">Photo</div>
    @endif
  </td>
</tr></table>

<div class="doc-title">FICHE D'INSCRIPTION {{ $anneeAcademique }}</div>

{{-- ══ IDENTIFICATION / ANCIENNE SCOLARITE ═══════════════════════════════ --}}
<table class="two-col"><tr>
  <td class="left">
    <div class="panel">
      <div class="panel-title">Identification de l'apprenant</div>
      <div class="panel-body">
        <table class="frow"><tr><td class="l">Fait le :</td><td class="v">{{ now()->format('d/m/Y') }}</td></tr></table>
        <table class="frow"><tr><td class="l">Matricule :</td><td class="v">{{ $student->matricule ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">N° Inscription :</td><td class="v">{{ $numInscription }}</td></tr></table>
        <table class="frow"><tr><td class="l">Année d'entrée :</td><td class="v">{{ $student->niveau_entree ?? '1ère année' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Prénom et nom :</td><td class="v">{{ $student->prenom }} {{ $student->nom }}</td></tr></table>
        <table class="frow"><tr><td class="l">Né le :</td><td class="v">{{ $student->date_naissance ? \Carbon\Carbon::parse($student->date_naissance)->format('d/m/Y') : '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">À :</td><td class="v">{{ $student->lieu_naissance ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Sexe :</td><td class="v">{{ $student->sexe === 'F' ? 'Féminin' : 'Masculin' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Nationalité :</td><td class="v">{{ $student->nationalite ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Civilité :</td><td class="v">{{ $student->civilite ?: ($student->sexe === 'F' ? 'Mlle' : 'M.') }}</td></tr></table>
        <table class="frow"><tr><td class="l">Adresse :</td><td class="v">{{ $student->adresse ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Téléphone :</td><td class="v">{{ $student->telephone ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Email :</td><td class="v" style="font-size:7px;">{{ $student->email ?? $student->user?->email ?? '—' }}</td></tr></table>
      </div>
    </div>
  </td>
  <td class="right">
    <div class="panel">
      <div class="panel-title">Ancienne scolarité</div>
      <div class="panel-body">
        <table class="frow"><tr><td class="l">Dernier diplôme :</td><td class="v">{{ $student->dernier_diplome ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">An diplôme :</td><td class="v">{{ $student->annee_bac ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Série :</td><td class="v">{{ $student->serie_college ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">École :</td><td class="v">{{ $student->dernier_etablissement ?? '—' }}</td></tr></table>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">Prise en charge</div>
      <div class="panel-body">
        <table class="frow"><tr><td class="l">Type inscription :</td><td class="v">{{ $student->type_inscription ?? 'Privée' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Nature bourse :</td><td class="v">{{ $student->nature_bourse ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Note :</td><td class="v"></td></tr></table>
      </div>
    </div>
  </td>
</tr></table>

{{-- ══ TUTEUR ═══════════════════════════════════════════════════════════ --}}
<div class="panel">
  <div class="panel-title">Identification du tuteur ou de l'entreprise</div>
  <div class="panel-body">
    <table class="two-col"><tr>
      <td class="left">
        <table class="frow"><tr><td class="l">Raison sociale :</td><td class="v">{{ $student->tuteur_nom ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Employeur :</td><td class="v">{{ $student->tuteur_profession ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Adresse :</td><td class="v">—</td></tr></table>
      </td>
      <td class="right">
        <table class="frow"><tr><td class="l">Tél bureau :</td><td class="v">{{ $student->tuteur_telephone ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">Cellulaire :</td><td class="v">{{ $student->tuteur_telephone ?? '—' }}</td></tr></table>
        <table class="frow"><tr><td class="l">N° Pièce identité :</td><td class="v">{{ $student->tuteur_identite ?? '—' }}</td></tr></table>
      </td>
    </tr></table>
  </div>
</div>

{{-- ══ ENGAGEMENTS ══════════════════════════════════════════════════════ --}}
<div class="panel">
  <div class="panel-title">Engagements</div>
  <div class="panel-body">
    <table class="two-col"><tr>
      <td class="left">
        <div style="font-size:7.5px;margin-bottom:4px;">Je soussigné(e) <b>{{ $student->prenom }} {{ $student->nom }}</b><br/>m'engage à payer le coût annuel de ma scolarité ainsi libellé :</div>
        <table class="eng-table">
          <tr><td class="l">Scolarité annuelle</td><td class="v">{{ number_format($scolariteAnnuelle, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais examen</td><td class="v">{{ number_format($fraisExamen, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais soutenance</td><td class="v">{{ number_format($fraisSoutenance, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais de dossier</td><td class="v">{{ number_format($fraisDossier, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais uniforme</td><td class="v">{{ number_format($fraisUniforme, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais assurance</td><td class="v">{{ number_format($fraisAssurance, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais amical</td><td class="v">{{ number_format($fraisAmical, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais bibliothèque</td><td class="v">{{ number_format($fraisBiblio, 0, ',', ' ') }}</td></tr>
          <tr><td class="l">Frais de stage</td><td class="v">{{ number_format($fraisStage, 0, ',', ' ') }}</td></tr>
        </table>
      </td>
      <td class="right">
        <div style="font-size:7.5px;margin-bottom:4px;">Je soussigné(e) :</div>
        <div style="font-size:7.5px;margin-bottom:4px;">m'engage à aviser le paiement de la scolarité de :</div>
        <div style="font-size:8px;font-weight:700;margin-bottom:4px;">{{ $student->prenom }} {{ $student->nom }}</div>
        <div style="font-size:7.5px;margin-bottom:2px;">Libellé ci-contre pour un montant de :</div>
        <div style="font-size:7.5px;">En chiffre : <b>{{ number_format($fraisInscription, 0, ',', ' ') }}</b></div>
      </td>
    </tr></table>
  </div>
</div>

{{-- ══ GRILLE DE PAIEMENT ═══════════════════════════════════════════════ --}}
<div class="pay-note">
  Paiement le 5 de chaque mois au plus tard &nbsp;&nbsp;&nbsp;&nbsp;
  <span style="float:right;">Frais d'inscription : {{ number_format($fraisInscription, 0, ',', ' ') }}</span>
</div>
<table class="pay-grid">
  <tr>
    @foreach($grilleColonnes as $colonne)
      <td>
        @foreach($colonne as [$label, $val])
          <div class="cell"><span class="m">{{ $label }} :</span><span class="v">{{ number_format($val, 0, ',', ' ') }}</span></div>
        @endforeach
      </td>
    @endforeach
  </tr>
</table>

{{-- ══ REGLEMENT INTERIEUR ══════════════════════════════════════════════ --}}
<div class="reglement">
  <div class="h">Extrait du règlement intérieur</div>
  <li>- L'inscription sera comptabilisée après règlement des frais et aucune somme ne sera remboursée, sauf si pour des raisons d'effectif, la session n'est pas ouverte.</li>
  <li>- Toute inscription rend obligatoire le coût annuel de la formation. Toute autre modalité de règlement, ne constitue que des facilités accordées aux apprenants qui le demandent.</li>
  <li>- L'apprenant s'engage à fournir toutes les pièces requises pour son inscription ou à compléter les pièces manquantes dans les délais requis, et atteste qu'elles sont toutes authentiques et légales. À défaut de cela, il engage sa responsabilité pénale et l'institut ne sera pas tenue de délivrer une quelconque attestation ou diplôme pour sa formation.</li>
</div>

<table class="sign-row"><tr>
  <td>Apprenant</td><td>Tuteur</td><td>Direction des études</td><td>La Caisse</td>
</tr></table>

<div style="text-align:center;font-size:6px;color:#94a3b8;margin-top:6px;">Développé par Multi Brain Tech</div>

</body>
</html>
