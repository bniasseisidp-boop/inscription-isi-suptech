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
  <div style="padding:34px 32px;">
    @if($nomDestinataire)
    <p style="color:#475569;font-size:14px;margin:0 0 18px;">Bonjour <strong>{{ $nomDestinataire }}</strong>,</p>
    @endif
    <h2 style="color:#1a3a8f;margin:0 0 18px;font-size:20px;">{{ $sujet }}</h2>
    <div style="color:#334155;font-size:14px;line-height:1.8;white-space:pre-line;">{{ $corps }}</div>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
      <a href="https://inscription.isisuptech.com" style="display:inline-block;background:#1a3a8f;color:#fff;font-weight:700;font-size:13px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Visiter ISI SUPTECH
      </a>
    </div>
  </div>
  <div style="background:#0a1628;padding:16px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">
    ISI SUPTECH — inscription.isisuptech.com</div>
</div>
</body>
</html>
