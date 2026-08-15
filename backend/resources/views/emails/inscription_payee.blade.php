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
    <div style="text-align:center;font-size:56px;margin-bottom:16px;">🎓</div>
    <h2 style="color:#166534;text-align:center;margin:0 0 16px;">Inscription confirmée !</h2>
    <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 20px;">
      Félicitations <strong>{{ $student->full_name }}</strong> !<br>
      Vos frais d'inscription ont bien été réglés. Votre dossier est désormais complet et votre place à
      <strong>ISI SUPTECH</strong> est confirmée pour l'année académique <strong>{{ $student->annee_scolaire }}</strong>.
    </p>

    <div style="background:#0a1628;color:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:2px;">Votre matricule étudiant</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:4px;margin:8px 0;color:#60a5fa;">{{ $student->matricule }}</div>
    </div>

    <div style="background:#eff6ff;border-radius:10px;padding:16px;font-size:13px;color:#1e40af;margin-bottom:20px;">
      <strong>Documents joints :</strong> votre attestation d'inscription{{ $fichePath ? ' et votre fiche d\'inscription' : '' }},
      à conserver précieusement.
    </div>

    <p style="color:#94a3b8;font-size:12px;">
      Connectez-vous à votre espace étudiant sur
      <a href="https://inscription.isisuptech.com" style="color:#2563eb;">inscription.isisuptech.com</a>
      pour suivre vos mensualités et télécharger votre carte étudiante dès qu'elle sera générée.
    </p>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com</div>
</div>
</body>
</html>
