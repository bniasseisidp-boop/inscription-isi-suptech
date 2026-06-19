<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Accès ISI SUPTECH</title>
</head>
<body>
  <p>Bonjour {{ $student->full_name }},</p>
  <p>Un compte étudiant a été créé pour vous par l'administration d'ISI SUPTECH.</p>
  <p>Accédez à la plateforme avec ces identifiants :</p>
  <ul>
    <li>Email : {{ $user->email }}</li>
    <li>Mot de passe temporaire : <strong>{{ $password }}</strong></li>
  </ul>
  <p>Après votre première connexion, vous pourrez changer votre mot de passe et compléter votre dossier.</p>
  <p>Cordialement,<br/>L'équipe ISI SUPTECH — Multi Brain Tech</p>
</body>
</html>
