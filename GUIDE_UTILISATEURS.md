# Guide d'utilisation — Plateforme ISI SUPTECH

Ce document explique, interface par interface, ce que chaque personne qui utilise la plateforme peut faire, à quoi sert chaque bouton, et comment réaliser les tâches courantes. Il est destiné au personnel de l'ISI SUPTECH (accueil, accueil pédagogique, caisse, professeurs, administration) ainsi qu'à toute nouvelle recrue qui doit prendre en main un poste.

**Adresses de la plateforme :**
- `isisuptech.com` — site vitrine public (redirige automatiquement vers l'adresse ci-dessous)
- `inscription.isisuptech.com` — la plateforme elle-même (vitrine, pré-inscription, connexion, tous les espaces de travail)

---

## Sommaire

1. [Acteurs du système](#1-acteurs-du-système)
2. [Connexion, mot de passe et sécurité](#2-connexion-mot-de-passe-et-sécurité)
3. [Espace Étudiant](#3-espace-étudiant)
4. [Interface Accueil](#4-interface-accueil)
5. [Interface Caisse](#5-interface-caisse)
6. [Interface Accueil Pédagogique](#6-interface-accueil-pédagogique)
7. [Interface Professeur](#7-interface-professeur)
8. [Interface Admin](#8-interface-admin)
9. [Interface Super Admin](#9-interface-super-admin)
10. [Documents officiels générables](#10-documents-officiels-générables)
11. [Dépannage rapide](#11-dépannage-rapide)

---

## 1. Acteurs du système

### Acteurs internes (personnel ISI SUPTECH)

| Rôle | Qui | Rôle principal |
|---|---|---|
| **Super Admin** | Direction / responsable informatique | Contrôle total de la plateforme : tout ce que fait un Admin, plus la sécurité globale, le contenu du site vitrine et les opérations sensibles (audit, maintenance, suppression de données). |
| **Admin** | Administration générale | Gestion complète des étudiants, des paiements, des filières, du personnel et du programme académique. |
| **Accueil Pédagogique** | Service pédagogique / scolarité | Inscription et suivi administratif des étudiants, gestion du programme (UE, matières, professeurs, notes), documents officiels. |
| **Caisse** | Agent de caisse / comptabilité | Enregistrement des paiements (inscription et mensualités), factures. |
| **Accueil** | Agent d'accueil / vigile | Vérification rapide du statut d'un étudiant (carte, QR code, matricule) pour autoriser ou non l'accès. |
| **Professeur** | Corps enseignant | Consultation de son propre emploi du temps, appel des présences et saisie des notes pour ses matières uniquement. |

### Acteurs externes

| Rôle | Qui | Rôle principal |
|---|---|---|
| **Candidat** | Futur étudiant qui postule en ligne | Remplit le formulaire de pré-inscription publique et suit l'avancement de son dossier. |
| **Étudiant** | Candidat accepté et inscrit | Gère son profil, ses paiements, consulte sa carte, son emploi du temps et ses bulletins. |
| **Visiteur** | Grand public | Consulte le site vitrine (présentation, filières, formations) sans compte. |

Chaque acteur interne se connecte avec un **compte nominatif** (email + mot de passe) créé soit par un Admin/Super Admin (personnel), soit automatiquement lors de l'inscription (étudiants). Il n'y a pas de compte partagé.

---

## 2. Connexion, mot de passe et sécurité

### Se connecter
1. Aller sur `inscription.isisuptech.com`
2. Cliquer sur **"Connexion"** (en haut à droite)
3. Entrer l'email et le mot de passe
4. La plateforme redirige automatiquement vers le bon espace selon le rôle du compte (pas besoin de choisir)

Si la double authentification (2FA) a été activée par le Super Admin, un code à 6 chiffres est envoyé par email à chaque connexion et doit être saisi pour continuer.

### Premier mot de passe (personnel)
Quand un Admin ou Super Admin crée un compte (staff ou professeur), un email est envoyé automatiquement avec un **mot de passe temporaire**. Il faut :
1. Se connecter une première fois avec ce mot de passe
2. Aller dans **"Mon profil"** (visible dans chaque interface, en général en haut ou dans le menu de gauche)
3. Changer le mot de passe pour un mot de passe personnel

### Mot de passe oublié
Sur la page de connexion, cliquer sur **"Mot de passe oublié"**, saisir l'email du compte — un lien de réinitialisation est envoyé par email (valable un temps limité).

### Photo de profil
Dans "Mon profil", chaque compte (staff, professeur, étudiant) peut changer sa photo affichée dans l'interface.

---

## 3. Espace Étudiant

*Acteur externe — l'étudiant gère lui-même son espace une fois son compte créé (par pré-inscription en ligne ou inscription directe par le personnel).*

### Pré-inscription (avant d'avoir un compte)
Sur la page d'accueil du site, bouton **"Pré-inscription"** :
1. Renseigner son identité, ses coordonnées, la filière et le niveau souhaités
2. Renseigner le tuteur, la naissance, l'adresse
3. Téléverser les documents obligatoires (bac, relevé de notes, CNI, acte de naissance — et bulletin de transfert si transfert d'un autre établissement)
4. Choisir un mot de passe
5. Valider — le dossier passe en statut **"En attente"**, en attente de validation par l'Accueil Pédagogique ou l'Admin

Le candidat reçoit un email de confirmation, puis un email quand son dossier est accepté ou s'il manque des documents.

### Une fois le compte actif — menu de gauche

| Section | Fonction |
|---|---|
| **Tableau de bord** | Vue d'ensemble : statut d'inscription, notifications, raccourcis |
| **Mon profil** | Compléter/modifier ses informations académiques, tuteur(s), contacts d'urgence et médicaux (si le profil n'est pas verrouillé par l'administration) |
| **Carte étudiante** | Voir et télécharger sa carte étudiante (QR code) une fois générée par le personnel |
| **Emploi du temps** | Consulter les créneaux de cours de son niveau, jour par jour |
| **Mes bulletins** | Voir la moyenne, le statut de validation par UE et télécharger le bulletin PDF officiel de chaque semestre |
| **Paiements** | Payer en ligne via Wave (si activé) ou suivre l'historique des paiements déjà enregistrés |
| **Suivi mensuel** | Voir mois par mois ce qui est payé, en retard ou à venir |

### Payer ses frais
- **En ligne (Wave)** : bouton "Payer" sur le mois concerné → redirection Wave → paiement confirmé automatiquement
- **À la caisse** : se présenter physiquement, l'agent de caisse enregistre le paiement, qui apparaît alors dans "Suivi mensuel"

---

## 4. Interface Accueil

*Rôle : filtrer l'accès physique à l'établissement en vérifiant en un coup d'œil si un étudiant est à jour de paiement.*

### Écran principal
Trois façons de vérifier un étudiant :

| Méthode | Comment |
|---|---|
| **Scanner par caméra** | Bouton "Ouvrir la caméra" → pointer la caméra sur le QR code de la carte étudiante |
| **Vérifier par matricule** | Taper le matricule (ex : `ISI-2026-0001`) et valider |
| **QR code manuel** | Coller le contenu du QR (utile avec un scanner physique/pistolet) |

Le résultat s'affiche en grand avec un code couleur :
- **Vert / "À jour"** : accès autorisé
- **Rouge / "Retard"** ou **"Inscription non payée"** : diriger l'étudiant vers la caisse

La liste des étudiants inscrits est aussi consultable directement (recherche par nom, matricule, filière), avec un badge rouge sur les non à jour.

---

## 5. Interface Caisse

*Rôle : enregistrer tous les paiements (inscription et mensualités) et éditer les documents financiers.*

### Menu de gauche

| Section | Fonction |
|---|---|
| **Tableau de bord** | Statistiques du jour/mois (montants encaissés, etc.) |
| **Étudiants** | Rechercher un étudiant et voir son historique de paiement |
| **Paiements** | Liste de tous les paiements enregistrés, filtrable |
| **Saisir paiement** | Enregistrer un nouveau paiement (voir ci-dessous) |
| **Impayés du mois** | Liste des étudiants n'ayant pas payé le mois en cours, avec export PDF |
| **Facture Proforma** | Générer une facture proforma (devis) pour une entreprise ou un bénéficiaire, avant paiement |
| **Mon profil** | Photo, mot de passe |

### Saisir un paiement
1. Aller dans **"Saisir paiement"**
2. Rechercher et sélectionner l'étudiant
3. Choisir le type : **Inscription** (premier paiement, débloque le compte) ou **Mensualité** (un ou plusieurs mois d'un coup)
4. Indiquer le montant, la méthode (espèces, chèque, virement, Wave...) et une note si besoin
5. Valider — un reçu PDF est généré automatiquement et peut être imprimé/téléchargé

Le système empêche de payer un mois déjà réglé, ou de sauter un mois impayé plus ancien pour en payer un plus récent.

### Demander une modification
Si un paiement a été mal saisi, la Caisse ne peut pas le modifier elle-même : elle doit faire une **demande de modification**, qui doit être approuvée par un Admin ou Super Admin avant d'être appliquée (traçabilité).

---

## 6. Interface Accueil Pédagogique

*Rôle : gérer l'inscription administrative des étudiants, le programme académique et les documents officiels. Accès identique pour un Admin (qui peut aussi tout faire ici via le raccourci "Accueil Pédagogique" dans son propre menu).*

### Écran principal
Menu de gauche = liste des **filières et niveaux** (cliquables pour filtrer). Deux onglets en haut de la liste d'étudiants :
- **Étudiants inscrits**
- **Candidats en attente** (dossiers de pré-inscription à traiter)

### Traiter un candidat
Dans l'onglet "Candidats en attente" : ouvrir le dossier, vérifier les documents, puis **Accepter** (le dossier passe en attente de paiement) ou laisser en attente si incomplet.

### Inscrire un étudiant directement (sans passer par la pré-inscription)
Bouton **"Inscrire un étudiant"** :
1. Renseigner identité, contact, naissance, adresse
2. **Nationalité** : liste déroulante (plus de champ libre)
3. Choisir filière et niveau
4. Sections optionnelles à remplir si l'information est disponible tout de suite : **Infos académiques** (bac, dernier diplôme...), **Tuteur(s)**, **Urgence & médical**
5. Valider — le compte est créé, un email avec mot de passe temporaire est envoyé, la carte étudiante est générée automatiquement

### Fiche d'un étudiant
En cliquant sur un étudiant : dossier complet, actions disponibles :
- **Compléter le profil** — ajouter/corriger les infos académiques, tuteur, urgence, médical après coup
- **Générer la carte** / **Télécharger la carte**
- **Verrouiller / déverrouiller le profil** — empêche ou autorise l'étudiant à modifier lui-même ses informations
- **Télécharger les documents officiels** (voir [section 10](#10-documents-officiels-générables))
- **Changer la photo**

### Télécharger la liste d'une classe
Bouton liste (icône) au-dessus du tableau d'étudiants → choisir *Liste de présence* (cases à cocher vierges) ou *Liste pour saisie de notes* → PDF prêt à imprimer.

### Gestion des filières & niveaux
Depuis le menu, créer/modifier une filière (nom, code, description) et ses niveaux/tarifs (nom, durée, mois de début/fin, frais d'inscription et mensuel). Un niveau peut être marqué **"Calcul simple"** pour les filières BT/BTS (voir section Programme & Notes).

### Programme & Notes
Bouton **"Programme & Notes"** — ouvre l'outil complet de gestion du cursus, organisé en 3 onglets :

**Onglet Programme**
- Choisir filière + niveau, puis le semestre
- Créer des **UE (modules)** avec leur code, nom et crédits
- Dans chaque UE, ajouter/modifier/supprimer des **matières** : code, nom, heures CM/TP/TD/TPE/VHT, coefficient, crédit propre, professeur assigné
- Pour une filière en "Calcul simple" (BT/BTS), les matières s'ajoutent directement au semestre, sans UE
- Icône **horloge** sur une matière → gérer son **emploi du temps** (jour, heure, salle)
- Bouton **"Télécharger l'emploi du temps (PDF)"** — édition imprimable de tout l'emploi du temps du semestre sélectionné

**Onglet Professeurs**
- Liste de tous les professeurs, ajout (nom, prénom, contact, spécialité)
- Bouton **"Créer un compte"** sur un professeur sans accès — envoie un email avec mot de passe temporaire pour qu'il se connecte à son propre espace

**Onglet Saisir les notes**
- Choisir filière/niveau/semestre puis rechercher l'étudiant (par nom **ou matricule**)
- Pour chaque matière : **Devoir** (/20, compte pour 40% — ou 50% en calcul simple) et **Examen** (/20, 60% ou 50%)
- Le bulletin se recalcule automatiquement en dessous après chaque enregistrement
- Bouton **"Verrouiller la saisie (profs)"** — bloque temporairement les professeurs pendant la génération officielle des bulletins (l'Accueil Pédagogique et l'Admin gardent toujours la main, eux)
- Bouton **"Télécharger le bulletin PDF"** — génère le bulletin officiel avec QR code

---

## 7. Interface Professeur

*Rôle : consulter uniquement ce qui le concerne — ses cours, ses classes, ses notes à saisir. Un compte est créé par un Admin/Accueil Pédagogique depuis l'onglet Professeurs de "Programme & Notes".*

### Mon emploi du temps
Tous les créneaux personnels du professeur, regroupés par jour, avec matière, filière/niveau et salle.

### Mes classes
Liste des matières enseignées. En ouvrant une matière, trois onglets :

| Onglet | Fonction |
|---|---|
| **Effectif** | Liste des étudiants de la classe concernée |
| **Présences** | Choisir une date, marquer chaque étudiant présent/absent, enregistrer l'appel |
| **Notes** | Saisir Devoir et Examen (/20) pour chaque étudiant de la classe |

Si l'administration a **verrouillé** la saisie pour ce semestre (le temps de générer les bulletins), les champs de notes deviennent temporairement en lecture seule — un message l'indique clairement.

---

## 8. Interface Admin

*Rôle : gestion complète de la plateforme au quotidien. Un Admin a accès à tout, sauf les opérations les plus sensibles réservées au Super Admin.*

### Menu de gauche

| Section | Fonction |
|---|---|
| **Tableau de bord** | Statistiques générales |
| **Étudiants** | Liste complète, fiche détaillée, modification, acceptation/rejet des candidats, suppression (avec corbeille) |
| **Paiements** | Vue d'ensemble de tous les paiements |
| **Enregistrer un paiement** | Raccourci direct vers l'interface Caisse |
| **Accueil Pédagogique** | Raccourci direct vers l'interface Accueil Pédagogique (inscription, programme, notes...) |
| **Filières & Niveaux** | Création/modification des filières et de leurs tarifs |
| **Programme & Notes** | Même outil que côté Accueil Pédagogique (UE, matières, professeurs, notes) |
| **Équipe staff** | Créer/supprimer des comptes Admin, Caisse, Accueil, Accueil Pédagogique |
| **Mois désactivés** | Désactiver un mois de paiement (ex : mois offert, vacances) pour toutes les filières ou une filière précise |
| **Permissions caisse** | Approuver ou refuser les demandes de modification de paiement faites par la Caisse |
| **Mon profil** | Photo, mot de passe |
| **Corbeille** | Étudiants supprimés — restauration possible ou suppression définitive |

### Gérer un candidat / étudiant
Depuis "Étudiants" : rechercher, ouvrir la fiche, **Accepter** ou **Rejeter** un dossier, **Modifier** les informations, **Verrouiller le profil**, générer les documents officiels, gérer les documents manquants.

### Gérer l'équipe
Dans "Équipe staff" : bouton pour créer un compte (nom, email, rôle) — un mot de passe temporaire est envoyé par email. Un compte peut être supprimé à tout moment.

---

## 9. Interface Super Admin

*Le Super Admin utilise le même tableau de bord que l'Admin, avec des sections supplémentaires réservées et un accès total à toutes les autres interfaces sans restriction (y compris Professeur, si un compte lui est créé).*

### Sections réservées au Super Admin

| Section | Fonction |
|---|---|
| **Journal d'audit** | Historique de toutes les actions sensibles effectuées sur la plateforme (qui a fait quoi, quand) |
| **Contenu du site** | Modifier les textes et images de la vitrine publique (statistiques affichées, blocs de contenu, formateurs, membres de l'équipe, partenaires, réseaux sociaux, témoignages) |
| **Newsletter** | Voir les abonnés, envoyer une annonce |

### Changer le rôle d'un membre du staff
Dans **"Équipe staff"**, un menu déroulant apparaît sur chaque ligne (visible seulement par le Super Admin) permettant de changer le rôle d'un compte — y compris le promouvoir **Super Admin**.

### Mode maintenance
Bloque l'accès à toute la plateforme (caisse, accueil, accueil pédagogique, étudiants) sauf au Super Admin — utile pour une intervention technique.

### Double authentification (2FA) forcée
Active l'obligation, pour tous les comptes, de confirmer chaque connexion par un code reçu par email.

### Opérations destructrices (à utiliser avec une extrême prudence)
- **Réinitialiser les données de test** — supprime les données de démonstration
- **Supprimer tous les comptes** — efface définitivement tous les comptes et leurs données sauf celui du Super Admin (les filières et niveaux sont conservés)

Ces deux actions sont **irréversibles**.

---

## 10. Documents officiels générables

Générables par l'Admin et l'Accueil Pédagogique, depuis la fiche d'un étudiant :

| Document | Description |
|---|---|
| **Fiche d'inscription** | Récapitulatif complet du dossier administratif de l'étudiant |
| **Attestation de scolarité** | Certifie que l'étudiant est inscrit pour l'année en cours |
| **Attestation d'inscription** | Certifie l'inscription à l'établissement |
| **Certificat de scolarité** | Variante officielle de l'attestation de scolarité |
| **Attestation de formation** | Certifie le suivi d'une formation |
| **Attestation de non-soutenance** | Pour un étudiant n'ayant pas encore soutenu son mémoire/projet |
| **Attestation de réussite** | Avec mention à saisir manuellement |
| **Attestation d'encouragement** | Format paysage, avec moyenne et période à saisir |
| **Diplôme de licence** | Format paysage, avec mention à saisir |
| **Carte étudiante** | Avec QR code, généré puis téléchargeable/réimprimable |
| **Bulletin de notes** | Par semestre, calculé automatiquement, avec QR code (Programme & Notes) |
| **Emploi du temps de la classe** | Par filière/niveau/semestre (Programme & Notes) |
| **Facture proforma** | Devis pour une entreprise ou un tuteur, avant paiement (Caisse) |
| **Reçu de paiement** | Généré automatiquement à chaque paiement enregistré (Caisse) |
| **Liste de présence / liste pour notes** | Par classe, à imprimer (Accueil Pédagogique) |

*Note : la référence (numéro) de la facture proforma et des attestations n'est pas générée automatiquement — elle est tamponnée manuellement par l'administration à la remise du document.*

---

## 11. Dépannage rapide

| Problème | Solution |
|---|---|
| Un membre du personnel ne reçoit pas l'email de son mot de passe temporaire | Vérifier le dossier spam ; en dernier recours, un Admin peut recréer le compte |
| Un étudiant ne peut pas modifier son profil | Son profil est probablement **verrouillé** — un Admin ou l'Accueil Pédagogique peut le déverrouiller depuis sa fiche |
| Impossible de saisir une note pour un professeur | La saisie est peut-être **verrouillée** pour ce semestre (génération des bulletins en cours) — contacter l'Admin ou l'Accueil Pédagogique |
| Un document PDF généré est vide ou incomplet | Vérifier que les informations correspondantes sont bien complétées dans la fiche de l'étudiant |
| La page semble bloquée après une mise à jour de la plateforme | Faire un rafraîchissement complet du navigateur (Ctrl+Maj+R) |
| Un étudiant ne voit pas son emploi du temps | Vérifier que des créneaux ont bien été créés pour sa filière/niveau dans Programme & Notes |

---

*Document à mettre à jour à chaque évolution majeure de la plateforme.*
