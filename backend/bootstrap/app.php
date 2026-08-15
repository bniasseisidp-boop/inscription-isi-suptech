<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// bootstrap/app.php s'exécute avant le cycle normal de démarrage de Laravel — le
// .env n'est donc pas encore chargé au moment où apiPrefix ci-dessous est évalué
// (c'est juste un argument de fonction, calculé immédiatement). On le charge donc
// manuellement en avance, uniquement pour rendre cette valeur disponible ici.
if (file_exists(dirname(__DIR__).'/.env')) {
    \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // En prod, Laravel est physiquement servi depuis un dossier "api/" (isisuptech.com/api/...) :
        // le préfixe "/api" est donc déjà fourni par l'emplacement du fichier, et Symfony le retire
        // automatiquement de l'URL vue par Laravel. Ajouter EN PLUS le préfixe "api" natif de Laravel
        // ferait chercher "/api/xxx" alors qu'il ne reste plus que "/xxx" → 404 sur toutes les routes.
        // En local (php artisan serve à la racine), rien n'est retiré, donc on garde le préfixe "api".
        api: __DIR__.'/../routes/api.php',
        apiPrefix: env('API_URL_PREFIX', 'api'),
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\CheckMaintenance::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
