# Implémentation du système d'inscription par étapes avec sauvegarde

Toutes les modifications nécessaires ont été effectuées pour permettre à un étudiant de s'inscrire en plusieurs étapes, de sauvegarder sa progression, et de reprendre plus tard.

## 🛠️ Modifications effectuées

### 1. Base de données
- [NEW] Migration `2026_07_15_123107_update_statut_inscription_add_brouillon.php` : ajout du statut `brouillon` (brouillon) dans l'énumération `statut_inscription` de la table `students`.

### 2. Backend (API & Contrôleurs)
- [MODIFY] [api.php](file:///c:/xampp/htdocs/inscription-isi-suptech/backend/routes/api.php) : Suppression de l'ancienne route unique `POST /inscription`. Ajout de trois nouvelles routes :
  - `POST /inscription/compte` (publique)
  - `POST /etudiant/inscription/etape` (protégée par auth)
  - `POST /etudiant/inscription/soumission` (protégée par auth)
- [MODIFY] [StudentController.php](file:///c:/xampp/htdocs/inscription-isi-suptech/backend/app/Http/Controllers/StudentController.php) : Découpage de l'ancienne logique d'inscription en 3 méthodes :
  - `creerCompte()` : Gère l'étape 0 (Identité + Compte).
  - `sauvegarderEtape()` : Met à jour partiellement l'étudiant avec les documents et autres informations.
  - `soumettreDossier()` : Valide le dossier complet, passe le statut de `brouillon` à `en_attente`, et envoie les emails.

### 3. Frontend (React)
- [MODIFY] [api.js](file:///c:/xampp/htdocs/inscription-isi-suptech/frontend/src/services/api.js) : Mise à jour des appels API pour correspondre aux nouvelles routes.
- [NEW] [MultiStepInscription.jsx](file:///c:/xampp/htdocs/inscription-isi-suptech/frontend/src/pages/MultiStepInscription.jsx) : Nouveau composant gérant l'inscription en 4 étapes. Ce composant est résilient et permet :
  - La création du compte (Étape 0).
  - La sauvegarde partielle et le bouton "Sauvegarder et quitter" (Étape 1 et 2).
  - La reprise depuis un état brouillon à la reconnexion.
  - L'envoi final des documents et validation (Étape 3).
- [MODIFY] [App.jsx](file:///c:/xampp/htdocs/inscription-isi-suptech/frontend/src/App.jsx) : Remplacement de l'ancien `PreInscription.jsx` par le nouveau `MultiStepInscription.jsx` sur la route `/pre-inscription`.
- [MODIFY] [StudentPortal.jsx](file:///c:/xampp/htdocs/inscription-isi-suptech/frontend/src/pages/StudentPortal.jsx) : Le tableau de bord redirige automatiquement vers `/pre-inscription` si le statut de l'étudiant connecté est `brouillon`.

## 🧪 Plan de vérification

> [!TIP]
> Pour tester la fonctionnalité :
> 1. Lancez votre serveur backend (`php artisan serve`) et frontend (`npm run dev`).
> 2. Allez sur le formulaire d'inscription et remplissez l'étape 1 (Création du compte).
> 3. Allez à l'étape 2 (Identité), remplissez quelques champs, puis cliquez sur "Sauvegarder et quitter".
> 4. Vous serez redirigé. Lors de votre reconnexion ou de l'accès au portail, vous serez forcé de revenir sur le formulaire à l'étape 2.
> 5. Complétez toutes les étapes jusqu'à la soumission finale. Le statut passera alors en attente d'examen.
