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
    <div style="text-align:center;font-size:44px;margin-bottom:12px;">📅</div>
    <h2 style="color:#1a3a8f;text-align:center;margin:0 0 6px;">Votre emploi du temps du jour</h2>
    <p style="color:#94a3b8;text-align:center;font-size:13px;margin:0 0 20px;text-transform:capitalize;">{{ $jourLabel }}</p>
    <p style="color:#475569;font-size:14px;margin:0 0 16px;">Bonjour <strong>{{ $student->prenom }} {{ $student->nom }}</strong>,</p>
    @foreach($creneaux as $c)
      <div style="background:#eff6ff;border-radius:10px;padding:12px 16px;font-size:13px;color:#1e40af;margin-bottom:8px;">
        <div style="font-weight:900;">{{ substr($c->heure_debut, 0, 5) }} – {{ substr($c->heure_fin, 0, 5) }}</div>
        <div>{{ $c->matiere->nom }}</div>
        <div style="color:#64748b;">
          {{ $c->matiere->professeur ? $c->matiere->professeur->prenom.' '.$c->matiere->professeur->nom : 'Professeur non assigné' }}
          @if($c->salle) · Salle {{ $c->salle }}@endif
        </div>
      </div>
    @endforeach
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com
  </div>
</div>
</body>
</html>
