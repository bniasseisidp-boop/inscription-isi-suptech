<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:26px 30px;text-align:center;">
    <img src="{{ $message->embed(public_path('isi-logo.png')) }}" alt="ISI SUPTECH" style="height:40px;margin-bottom:8px;">
    <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:3px;">ISI SUPTECH</div>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">Institut Supérieur d'Informatique</div>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center;font-size:48px;margin-bottom:16px;">📋</div>
    <h2 style="color:#1e3a5f;text-align:center;margin:0 0 16px;">Votre dossier est à compléter</h2>
    <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 20px;">
      Bonjour <strong>{{ $student->full_name }}</strong>,
    </p>

    <div style="background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:16px;margin-bottom:20px;">
      <strong style="color:#713f12;font-size:13px;">⏳ Délai : {{ $dateLimite->format('d/m/Y') }}</strong>
      <p style="color:#92400e;font-size:12px;margin:6px 0 0;">Passé ce délai, votre candidature sera automatiquement clôturée.</p>
    </div>

    <div style="white-space:pre-line;color:#334155;font-size:13px;line-height:1.7;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">{{ $message }}</div>

    <p style="font-size:13px;color:#64748b;">
      Connectez-vous à votre espace candidat pour suivre l'état de votre dossier :<br>
      <a href="https://inscription.isisuptech.com/connexion" style="color:#2563eb;font-weight:600;">inscription.isisuptech.com</a>
    </p>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com &nbsp;|&nbsp;
    <span style="color:#60a5fa;">Multi Brain Tech</span>
  </div>
</div>
</body>
</html>
