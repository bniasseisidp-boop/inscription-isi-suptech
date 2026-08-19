<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:26px 30px;text-align:center;">
    <img src="{{ $message->embed(public_path('isi-logo.png')) }}" alt="ISI SUPTECH" style="height:40px;margin-bottom:8px;">
    <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:2px;">ISI SUPTECH</div>
  </div>
  <div style="padding:30px;">
    <div style="text-align:center;font-size:44px;margin-bottom:12px;">⏰</div>
    <h2 style="color:#1a3a8f;text-align:center;margin:0 0 16px;">Rappel de cours</h2>
    <p style="color:#475569;font-size:14px;text-align:center;margin:0 0 20px;">
      Bonjour <strong>{{ $professeur->prenom }} {{ $professeur->nom }}</strong>,<br>
      Vous avez cours dans <strong>2 heures</strong>.
    </p>
    <div style="background:#eff6ff;border-radius:10px;padding:16px;font-size:14px;color:#1e40af;margin-bottom:8px;">
      <div style="margin-bottom:6px;"><strong>Matière :</strong> {{ $matiere->nom }}</div>
      <div style="margin-bottom:6px;"><strong>Classe :</strong> {{ $classeLabel }}</div>
      <div style="margin-bottom:6px;"><strong>Horaire :</strong> {{ substr($creneau->heure_debut, 0, 5) }} – {{ substr($creneau->heure_fin, 0, 5) }}</div>
      @if($creneau->salle)<div><strong>Salle :</strong> {{ $creneau->salle }}</div>@endif
    </div>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com
  </div>
</div>
</body>
</html>
