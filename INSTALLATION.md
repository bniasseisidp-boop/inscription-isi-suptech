# ISI SUPTECH — Guide d'Installation

## Prérequis
- XAMPP avec PHP 8.3 (C:\xampp\htdocs\)
- Composer
- Node.js 18+
- MySQL (via XAMPP)

---

## 1. Installation Backend (Laravel - PHP 8.3)

### Copier le dossier backend dans htdocs
```
Copier : Inscription-ISI-SUPTECH/backend/
Vers   : C:\xampp\htdocs\isi-suptech-api\
```

### Ouvrir un terminal dans C:\xampp\htdocs\isi-suptech-api\

```bash
# Installer les dépendances
composer install

# Copier la config
cp .env.example .env

# Générer la clé
php artisan key:generate
```

### Configurer .env
```
DB_DATABASE=isi_suptech
DB_USERNAME=root
DB_PASSWORD=          ← laisser vide si pas de mot de passe
FRONTEND_URL=http://localhost:3000
```

### Créer la base de données
1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Créer une base : `isi_suptech` (UTF-8, utf8mb4_unicode_ci)

### Migrations et données
```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

### Démarrer le serveur
```bash
php artisan serve --port=8000
```

L'API sera disponible sur : http://localhost:8000

---

## 2. Installation Frontend (React)

### Dans le dossier frontend/
```bash
cd "C:\Users\azoto\OneDrive\Desktop\Inscription-ISI-SUPTECH\frontend"
npm install
npm run dev
```

Le site sera disponible sur : http://localhost:3000

---

## 3. Comptes par défaut

| Rôle        | Email                      | Mot de passe   |
|-------------|----------------------------|----------------|
| Admin       | admin@isisuptech.com       | Admin@2025!    |
| Caissier    | caisse@isisuptech.com      | Caisse@2025!   |
| Accueil     | accueil@isisuptech.com     | Accueil@2025!  |

---

## 4. Configuration Wave Payment
Dans .env :
```
WAVE_API_KEY=sk_wave_xxxxxxxxxxxxxxxx
WAVE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

URL Webhook à configurer dans le dashboard Wave :
`https://votre-domaine.com/api/webhook/wave`

---

## 5. Configuration Email (Gmail)
Dans .env :
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx   ← Mot de passe d'application Gmail
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=inscription@isisuptech.com
MAIL_FROM_NAME="ISI SUPTECH"
```

---

## Structure du projet
```
Inscription-ISI-SUPTECH/
├── backend/          ← API Laravel (PHP 8.3)
│   ├── app/
│   ├── database/
│   └── routes/
└── frontend/         ← Interface React
    └── src/
        ├── pages/    ← Landing, PreInscription, StudentPortal, Admin, Caisse, Accueil
        └── services/ ← API client
```

---

*Développé par **Multi Brain Tech** — inscription.isisuptech.com*
