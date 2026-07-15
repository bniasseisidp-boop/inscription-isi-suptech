# Refonte du Processus d'Inscription (Multi-étapes)

## Description de l'objectif
Actuellement, la pré-inscription (`StudentController@preInscription`) exige de soumettre un formulaire gigantesque en une seule fois (informations personnelles, académiques, et tous les documents PDF requis). Si un candidat n'a pas un document sous la main, il perd toute sa progression.

L'objectif est de diviser l'inscription en plusieurs étapes avec sauvegarde automatique :
1. **Création du compte** : Informations de base (Nom, Prénom, Email, Mot de passe).
2. **Complétion du dossier** : Le candidat peut se connecter, remplir ses informations personnelles, choisir sa filière, et uploader ses documents à son rythme.
3. **Soumission finale** : Une fois le dossier complet à 100%, le candidat valide, ce qui change son statut en `en_attente` et notifie l'administration.

> [!TIP]
> C'est une excellente idée sur le plan de l'expérience utilisateur (UX). Cela réduira considérablement le taux d'abandon lors de l'inscription !

## User Review Required
> [!IMPORTANT]
> - Êtes-vous d'accord pour ajouter un nouveau statut `brouillon` (ou "en cours de saisie") à la liste des statuts d'inscription (`statut_inscription`) ?
> - Souhaitez-vous que les emails de confirmation (à l'étudiant et aux administrateurs) ne soient envoyés **que lors de la soumission finale** du dossier complet (étape 3) ?

## Proposed Changes

### Backend (API Laravel)

#### [MODIFY] `database/migrations/xxxx_xx_xx_update_statut_inscription_brouillon.php` (NOUVEAU FICHIER)
- Ajouter un nouveau statut `brouillon` à la colonne `statut_inscription` de la table `students` et définir cette valeur par défaut lors de la création initiale du compte.

#### [MODIFY] `routes/api.php`
- Scinder la route d'inscription existante.
- Créer `POST /inscription/compte` (Étape 1 : Création de compte).
- Créer `POST /etudiant/inscription/etape` (Étape 2 : Sauvegarde partielle des données et documents) dans le groupe middleware authentifié.
- Créer `POST /etudiant/inscription/soumission` (Étape 3 : Validation finale).

#### [MODIFY] `app/Http/Controllers/StudentController.php`
- **`creerCompte`** : Reçoit nom, prénom, email, mot de passe. Crée le `User` et une entrée basique `Student` avec statut `brouillon`. Retourne un token de connexion.
- **`sauvegarderEtape`** : Permet à un candidat connecté (statut `brouillon`) d'envoyer des mises à jour partielles (filière, documents, etc.). Validation allégée (nullable).
- **`soumettreDossier`** : Vérifie que *tous* les champs obligatoires (documents inclus) sont présents. Passe le statut à `en_attente`, génère la notification système et envoie les emails (déplacés depuis l'ancienne méthode).

### Frontend (React)

#### [MODIFY] `frontend/src/pages/PreInscription.jsx` (ou équivalent)
- Transformer la page en un assistant multi-étapes (Wizard).
- **Étape 1** : Création du compte (Appel à `/inscription/compte`). Enregistre le token de session.
- **Étapes suivantes** : Formulaires séparés par thématique (État civil, Choix de formation, Documents). Les champs sont pré-remplis si des données existent déjà sur le profil de l'étudiant.
- **Bouton "Sauvegarder et continuer plus tard"** qui fait un appel partiel à l'API.

#### [MODIFY] `frontend/src/pages/StudentDashboard.jsx` (ou portail)
- Si l'utilisateur connecté a le statut `brouillon`, afficher une alerte bloquante l'invitant à "Terminer son inscription" au lieu d'afficher le tableau de bord normal, et le rediriger vers le formulaire.

## Verification Plan

### Automated Tests
- Je n'en créerai pas de nouveaux à moins que l'application ne contienne déjà une suite de tests complète, mais je m'assurerai que le code backend ne génère pas d'erreurs (compilation, requêtes SQL).

### Manual Verification
- Je vous demanderai de tester l'inscription de bout en bout sur l'interface frontend : créer un compte avec une adresse email, uploader un fichier, se déconnecter, se reconnecter, constater que les données sont conservées, et soumettre définitivement le dossier.
