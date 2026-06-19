<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\AccueilPedagogiqueController;

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
        Route::post('/profil/photo', [StudentProfileController::class, 'updatePhoto']);
        Route::delete('/paiement/{id}', [StudentProfileController::class, 'cancelPayment']);
        Route::get('/paiement/{id}/recu', [StudentProfileController::class, 'downloadReceipt']);
        Route::get('/carte/telecharger', [StudentProfileController::class, 'downloadCard']);
    });

    // ── Admin routes ────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        // Étudiants
        Route::get('/etudiants', [AdminController::class, 'students']);
        Route::post('/etudiants', [AdminController::class, 'createStudent']);
        Route::post('/etudiants/{student}/accepter', [AdminController::class, 'acceptStudent']);
        Route::post('/etudiants/{student}/rejeter', [AdminController::class, 'rejectStudent']);
        Route::post('/etudiants/{student}/verrouiller-profil', [AdminController::class, 'lockProfile']);
        Route::post('/etudiants/{student}/carte', [AdminController::class, 'generateCard']);
        Route::delete('/etudiants/{student}', [AdminController::class, 'deleteStudent']);
        // Corbeille
        Route::get('/etudiants/corbeille', [AdminController::class, 'trashedStudents']);
        Route::post('/etudiants/{id}/restaurer', [AdminController::class, 'restoreStudent']);
        Route::delete('/etudiants/{id}/forcer', [AdminController::class, 'forceDeleteStudent']);
        // Paiements
        Route::get('/paiements', [AdminController::class, 'payments']);
        // Filières & niveaux
        Route::get('/filieres', [AdminController::class, 'filieres']);
        Route::post('/filieres', [AdminController::class, 'createFiliere']);
        Route::put('/filieres/{filiere}', [AdminController::class, 'updateFiliere']);
        Route::delete('/filieres/{filiere}', [AdminController::class, 'deleteFiliere']);
        Route::post('/licenses', [AdminController::class, 'createLicense']);
        Route::put('/licenses/{license}', [AdminController::class, 'updateLicense']);
        Route::delete('/licenses/{license}', [AdminController::class, 'deleteLicense']);
        // Paramètres admin
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        // Staff
        Route::get('/staff', [AdminController::class, 'staff']);
        Route::post('/staff', [AdminController::class, 'createStaff']);
        Route::delete('/staff/{user}', [AdminController::class, 'deleteStaff']);
        // Mois désactivés
        Route::get('/mois-desactives', [AdminController::class, 'getMoisDesactives']);
        Route::post('/mois-desactives', [AdminController::class, 'toggleMoisDesactive']);

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
        Route::get('/etudiants-attente', [PaymentController::class, 'etudiantsAttentePaiement']);
        Route::get('/etudiants', [PaymentController::class, 'etudiantsList']);
        Route::get('/etudiants/{id}/suivi', [PaymentController::class, 'etudiantSuivi']);
        Route::get('/mois-desactives', [PaymentController::class, 'moisDesactives']);
        Route::get('/impayes-mois', [PaymentController::class, 'impayesMois']);
        Route::get('/impayes-mois/pdf', [PaymentController::class, 'impayesMoisPdf']);
    });

    // ── Admin — reset données test ──────────────────────────────────────────
    Route::middleware('role:admin')->post('/admin/reset-donnees-test', [AdminController::class, 'resetDonneesTest']);

    // ── Accueil routes ──────────────────────────────────────────────────────
    Route::middleware('role:accueil,admin')->prefix('accueil')->group(function () {
        Route::get('/etudiants', [StudentController::class, 'publicList']);
        Route::post('/qr/verify', [StudentController::class, 'verifyQR']);
        Route::get('/verify-matricule/{matricule}', [StudentController::class, 'verifyMatricule']);
    });

    // ── Accueil Pédagogique routes ──────────────────────────────────────────
    Route::middleware('role:pedagogique,admin')->prefix('pedagogique')->group(function () {
        Route::get('/classes',                                [AccueilPedagogiqueController::class, 'classes']);
        Route::get('/classes/liste-pdf',                      [AccueilPedagogiqueController::class, 'classListPdf']);
        Route::get('/etudiants',                              [AccueilPedagogiqueController::class, 'students']);
        Route::post('/etudiants',                             [AccueilPedagogiqueController::class, 'addStudent']);
        Route::get('/etudiants/{student}',                    [AccueilPedagogiqueController::class, 'studentDetail']);
        Route::post('/etudiants/{student}/carte',             [AccueilPedagogiqueController::class, 'generateCard']);
        Route::get('/etudiants/{student}/carte/telecharger',  [AccueilPedagogiqueController::class, 'downloadCard']);
        Route::post('/etudiants/{student}/verrouiller',       [AccueilPedagogiqueController::class, 'toggleLock']);
        Route::post('/etudiants/{student}/photo',             [AccueilPedagogiqueController::class, 'updatePhoto']);
        Route::get('/candidats',                              [AccueilPedagogiqueController::class, 'pendingStudents']);
        Route::post('/candidats/{student}/accepter',          [AccueilPedagogiqueController::class, 'acceptStudent']);
        // Paramètres pédagogique (lecture seule)
        Route::get('/settings',                               [AdminController::class, 'getPedagogiqueSettings']);
        // Filières & niveaux (admin + pédagogique)
        Route::get('/filieres',                               [AdminController::class, 'filieres']);
        Route::post('/filieres',                              [AdminController::class, 'createFiliere']);
        Route::put('/filieres/{filiere}',                     [AdminController::class, 'updateFiliere']);
        Route::delete('/filieres/{filiere}',                  [AdminController::class, 'deleteFiliere']);
        Route::post('/licenses',                              [AdminController::class, 'createLicense']);
        Route::put('/licenses/{license}',                     [AdminController::class, 'updateLicense']);
        Route::delete('/licenses/{license}',                  [AdminController::class, 'deleteLicense']);
    });
});
