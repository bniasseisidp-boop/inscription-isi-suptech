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
    <div style="text-align:center;font-size:48px;margin-bottom:16px;">🔐</div>
    <h2 style="color:#1a3a8f;text-align:center;margin:0 0 16px;">Code de vérification</h2>
    <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 24px;">
      La vérification en deux étapes est requise pour votre compte. Saisissez le code ci-dessous pour terminer votre connexion.
    </p>

    <div style="background:#0a1628;color:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:2px;">Votre code</div>
      <div style="font-size:36px;font-weight:900;letter-spacing:10px;margin:8px 0 0;color:#60a5fa;">{{ $code }}</div>
    </div>

    <div style="background:#eff6ff;border-radius:10px;padding:16px;font-size:13px;color:#1e40af;margin-bottom:20px;">
      Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette tentative de connexion, ignorez cet email et changez votre mot de passe.
    </div>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com &nbsp;|&nbsp;
    <span style="color:#60a5fa;">Multi Brain Tech</span>
  </div>
</div>
</body>
</html>
