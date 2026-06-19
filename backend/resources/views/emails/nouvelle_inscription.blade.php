<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:28px 30px;text-align:center;">
    <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:3px;">ISI SUPTECH</div>
    <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:4px;text-transform:uppercase;letter-spacing:2px;">Nouvelle Pré-Inscription</div>
  </div>

  <!-- Alert badge -->
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 24px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:20px;">📋</span>
    <div>
      <strong style="color:#92400e;font-size:13px;">Action requise — Dossier à examiner</strong>
      <p style="color:#a16207;font-size:12px;margin:3px 0 0;">Un nouveau candidat vient de soumettre sa pré-inscription. Connectez-vous au tableau de bord pour examiner son dossier.</p>
    </div>
  </div>

  <!-- Content -->
  <div style="padding:28px 30px;">
    <h2 style="color:#1e3a5f;margin:0 0 20px;font-size:18px;">Informations du candidat</h2>

    <!-- Identity -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;width:40%;border-bottom:1px solid #e2e8f0;">Nom complet</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #e2e8f0;">{{ $student->full_name }}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Email</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">{{ $student->user->email ?? '—' }}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Téléphone</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">{{ $student->telephone }}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Date de naissance</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">{{ $student->date_naissance?->format('d/m/Y') ?? '—' }}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Nationalité</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">{{ $student->nationalite }}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Filière souhaitée</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;font-weight:700;border-bottom:1px solid #e2e8f0;">{{ $student->filiere->nom ?? '—' }}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Niveau</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">{{ $student->license->nom ?? '—' }}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;">Type de candidature</td>
        <td style="padding:10px 14px;font-size:13px;color:#1e293b;">
          @if($student->est_transfert)
            <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">Transfert d'une autre école</span>
          @else
            <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">Nouveau bachelier</span>
          @endif
        </td>
      </tr>
    </table>

    <!-- Documents status -->
    <h3 style="color:#1e3a5f;margin:0 0 12px;font-size:15px;">Documents soumis</h3>
    <div style="background:#f8fafc;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span style="color:{{ $student->doc_bac ? '#16a34a' : '#ef4444' }};">{{ $student->doc_bac ? '✅' : '❌' }}</span>
          <span style="color:#475569;">Diplôme du Baccalauréat</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span style="color:{{ $student->doc_releve_notes ? '#16a34a' : '#ef4444' }};">{{ $student->doc_releve_notes ? '✅' : '❌' }}</span>
          <span style="color:#475569;">Relevé de notes</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span style="color:{{ $student->doc_cin ? '#16a34a' : '#ef4444' }};">{{ $student->doc_cin ? '✅' : '❌' }}</span>
          <span style="color:#475569;">Photocopie CIN légalisée</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span style="color:{{ $student->doc_acte_naissance ? '#16a34a' : '#ef4444' }};">{{ $student->doc_acte_naissance ? '✅' : '❌' }}</span>
          <span style="color:#475569;">Acte de naissance</span>
        </div>
        @if($student->est_transfert)
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span style="color:{{ $student->doc_bulletin_transfert ? '#16a34a' : '#ef4444' }};">{{ $student->doc_bulletin_transfert ? '✅' : '❌' }}</span>
          <span style="color:#475569;">Bulletin de transfert (60 crédits)</span>
        </div>
        @endif
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/admin"
         style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#0891b2);color:#fff;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;letter-spacing:0.3px;">
        🔍 Examiner le dossier dans l'admin
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;text-align:center;">
    <p style="color:#94a3b8;font-size:11px;margin:0;">
      ISI SUPTECH — Système de gestion des inscriptions<br>
      Cet email est envoyé automatiquement, ne pas répondre directement.
    </p>
  </div>
</div>
</body>
</html>
