<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:30px;text-align:center;">
    <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:3px;">ISI SUPTECH</div>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">Institut Supérieur d'Informatique</div>
  </div>
  <div style="padding:30px;">
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Reçu de paiement confirmé</h2>
    <p style="color:#475569;font-size:14px;margin:0 0 24px;">
      Bonjour <strong>{{ $payment->student->full_name }}</strong>,<br>
      Votre paiement a été enregistré avec succès.
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Montant payé</div>
      <div style="font-size:36px;font-weight:900;color:#1e3a5f;margin:6px 0;">{{ number_format($payment->montant, 0, ',', ' ') }}</div>
      <div style="color:#64748b;font-size:13px;">Francs CFA (XOF)</div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      @foreach([
        ['Référence', '#'.str_pad($payment->id,6,'0',STR_PAD_LEFT)],
        ['Type', $payment->libelle],
        ['Méthode', strtoupper($payment->methode)],
        ['Date', $payment->date_paiement?->format('d/m/Y H:i')],
        ['Filière', $payment->student->filiere?->nom],
        ['Matricule', $payment->student->matricule],
      ] as [$label, $val])
      <tr>
        <td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">{{ $label }}</td>
        <td style="padding:8px 0;color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9;">{{ $val }}</td>
      </tr>
      @endforeach
    </table>

    <p style="color:#64748b;font-size:13px;">Le reçu PDF est joint à cet email. Conservez-le pour vos archives.</p>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com &nbsp;|&nbsp;
    <span style="color:#60a5fa;">Multi Brain Tech</span>
  </div>
</div>
</body>
</html>
