<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\ContentController;

// ─── Public routes ──────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/inscription', [StudentController::class, 'preInscription']);
Route::get('/etudiants/publics', [StudentController::class, 'publicList']);
Route::post('/qr/verify', [StudentController::class, 'verifyQR']);
Route::get('/filieres', [AdminController::class, 'filieres']);

// Public content routes
Route::prefix('contenu')->group(function () {
    Route::get('/formateurs', [ContentController::class, 'getFormateurs']);
    Route::get('/membres-admins', [ContentController::class, 'getMembresAdmins']);
    Route::get('/partenaires', [ContentController::class, 'getPartenaires']);
    Route::get('/temoignages', [ContentController::class, 'getTemoignages']);
    Route::post('/temoignages', [ContentController::class, 'submitTemoignage']);
});
Route::get('/filieres/{id}', [ContentController::class, 'filiereDetail']);
Route::get('/settings/social', [ContentController::class, 'getSocialSettings']);
Route::post('/newsletter/subscribe', [ContentController::class, 'subscribeNewsletter']);

// Wave webhook (no auth, but signature verified internally)
Route::post('/webhook/wave', [PaymentController::class, 'waveWebhook']);

// ─── Authenticated routes ────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Student routes ──────────────────────────────────────────────────────
    Route::middleware('role:student')->prefix('etudiant')->group(function () {
        Route::get('/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/paiements', [StudentController::class, 'payments']);
        Route::post('/paiement/initier', [StudentController::class, 'initiatePayment']);
        Route::post('/notifications/lire', [StudentController::class, 'markNotificationsRead']);
        Route::get('/profil', [StudentProfileController::class, 'show']);
        Route::put('/profil', [StudentProfileController::class, 'update']);
        Route::get('/suivi-paiements', [StudentProfileController::class, 'suiviPaiements']);
    });

    // ── Admin routes ────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/etudiants', [AdminController::class, 'students']);
        Route::post('/etudiants', [AdminController::class, 'createStudent']);
        Route::post('/etudiants/{student}/accepter', [AdminController::class, 'acceptStudent']);
        Route::post('/etudiants/{student}/rejeter', [AdminController::class, 'rejectStudent']);
        Route::post('/etudiants/{student}/carte', [AdminController::class, 'generateCard']);
        Route::get('/paiements', [AdminController::class, 'payments']);
        Route::get('/filieres', [AdminController::class, 'filieres']);
        Route::post('/filieres', [AdminController::class, 'createFiliere']);
        Route::post('/licenses', [AdminController::class, 'createLicense']);
        Route::get('/staff', [AdminController::class, 'staff']);
        Route::post('/staff', [AdminController::class, 'createStaff']);

        // Content management
        Route::prefix('contenu')->group(function () {
            // Formateurs
            Route::get('/formateurs', [ContentController::class, 'adminFormateurs']);
            Route::post('/formateurs', [ContentController::class, 'createFormateur']);
            Route::post('/formateurs/{id}', [ContentController::class, 'updateFormateur']);
            Route::delete('/formateurs/{id}', [ContentController::class, 'deleteFormateur']);
            // Membres
            Route::get('/membres', [ContentController::class, 'adminMembres']);
            Route::post('/membres', [ContentController::class, 'createMembre']);
            Route::delete('/membres/{id}', [ContentController::class, 'deleteMembre']);
            // Partenaires
            Route::get('/partenaires', [ContentController::class, 'adminPartenaires']);
            Route::post('/partenaires', [ContentController::class, 'createPartenaire']);
            Route::delete('/partenaires/{id}', [ContentController::class, 'deletePartenaire']);
            // Témoignages
            Route::get('/temoignages', [ContentController::class, 'adminTemoignages']);
            Route::post('/temoignages/{id}/approuver', [ContentController::class, 'approuverTemoignage']);
            Route::delete('/temoignages/{id}', [ContentController::class, 'deleteTemoignage']);
            // Newsletter
            Route::get('/newsletter', [ContentController::class, 'newsletterSubscribers']);
            // Social settings
            Route::get('/social', [ContentController::class, 'getSocialSettings']);
            Route::post('/social', [ContentController::class, 'updateSocialSettings']);
        });
    });

    // ── Cashier routes ──────────────────────────────────────────────────────
    Route::middleware('role:cashier,admin')->prefix('caisse')->group(function () {
        Route::get('/paiements', [PaymentController::class, 'index']);
        Route::post('/paiement', [PaymentController::class, 'manualPayment']);
        Route::get('/stats', [PaymentController::class, 'stats']);
        Route::get('/paiement/{payment}/recu', [PaymentController::class, 'downloadReceipt']);
    });

    // ── Accueil routes ──────────────────────────────────────────────────────
    Route::middleware('role:accueil,admin')->prefix('accueil')->group(function () {
        Route::get('/etudiants', [StudentController::class, 'publicList']);
        Route::post('/qr/verify', [StudentController::class, 'verifyQR']);
    });
});
