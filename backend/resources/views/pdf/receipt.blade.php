<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1a2744; background: #fff; }
  .header { background: linear-gradient(135deg, #0a1628, #1e3a5f); color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; }
  .logo-area h1 { font-size: 22px; font-weight: 700; letter-spacing: 2px; }
  .logo-area p { font-size: 10px; opacity: 0.8; margin-top: 2px; }
  .badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 8px 15px; border-radius: 20px; text-align: center; }
  .badge .label { font-size: 9px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
  .badge .number { font-size: 16px; font-weight: 700; }
  .title-section { background: #f0f4ff; padding: 15px 30px; border-left: 4px solid #3b82f6; margin: 0; }
  .title-section h2 { font-size: 18px; color: #1e3a5f; }
  .title-section p { color: #64748b; font-size: 11px; margin-top: 3px; }
  .content { padding: 20px 30px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
  .info-card { background: #f8faff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .info-card .label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .info-card .value { font-size: 13px; font-weight: 600; color: #1e3a5f; }
  .amount-box { background: linear-gradient(135deg, #1e3a5f, #3b82f6); color: white; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
  .amount-box .amount-label { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
  .amount-box .amount { font-size: 32px; font-weight: 700; margin: 5px 0; }
  .amount-box .currency { font-size: 14px; opacity: 0.9; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .status-complete { background: #dcfce7; color: #166534; }
  .footer { background: #0a1628; color: rgba(255,255,255,0.6); text-align: center; padding: 12px; font-size: 9px; margin-top: 20px; }
  .footer strong { color: #60a5fa; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 15px 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #1e3a5f; color: white; padding: 8px 10px; font-size: 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo-area">
    <h1>ISI SUPTECH</h1>
    <p>Institut Supérieur d'Informatique — Groupe ISI</p>
  </div>
  <div class="badge">
    <div class="label">Reçu N°</div>
    <div class="number">#{{ str_pad($payment->id, 6, '0', STR_PAD_LEFT) }}</div>
  </div>
</div>

<div class="title-section">
  <h2>Reçu de Paiement</h2>
  <p>Émis le {{ now()->format('d/m/Y à H:i') }}</p>
</div>

<div class="content">
  <div class="info-grid">
    <div class="info-card">
      <div class="label">Étudiant</div>
      <div class="value">{{ $payment->student->full_name }}</div>
    </div>
    <div class="info-card">
      <div class="label">Matricule</div>
      <div class="value">{{ $payment->student->matricule ?? 'En attente' }}</div>
    </div>
    <div class="info-card">
      <div class="label">Filière</div>
      <div class="value">{{ $payment->student->filiere?->nom ?? '-' }}</div>
    </div>
    <div class="info-card">
      <div class="label">Licence</div>
      <div class="value">{{ $payment->student->license?->nom ?? '-' }}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant payé</div>
    <div class="amount">{{ number_format($payment->montant, 0, ',', ' ') }}</div>
    <div class="currency">Francs CFA (XOF)</div>
  </div>

  <table>
    <tr>
      <th>Type de paiement</th>
      <th>Période</th>
      <th>Méthode</th>
      <th>Date</th>
      <th>Statut</th>
    </tr>
    <tr>
      <td>{{ $payment->libelle }}</td>
      <td>{{ $payment->mois ?? $payment->annee_scolaire ?? '-' }}</td>
      <td>{{ strtoupper($payment->methode) }}</td>
      <td>{{ $payment->date_paiement?->format('d/m/Y H:i') ?? '-' }}</td>
      <td><span class="status-badge status-complete">Confirmé</span></td>
    </tr>
  </table>

  @if($payment->wave_transaction_id)
  <hr class="divider">
  <p style="color:#64748b;font-size:10px;">Référence Wave : <strong>{{ $payment->wave_transaction_id }}</strong></p>
  @endif
</div>

<div class="footer">
  <p>Ce reçu a été généré automatiquement par la plateforme ISI SUPTECH</p>
  <p>Développé par <strong>Multi Brain Tech</strong> — inscription.isisuptech.com</p>
</div>
</body>
</html>
