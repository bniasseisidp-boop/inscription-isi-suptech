<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Necessite une entree cron cote serveur : * * * * * php artisan schedule:run
// (a configurer dans cPanel > Cron Jobs — voir INSTALLATION.md).
Schedule::command('cours:rappels-profs')->everyFiveMinutes();
Schedule::command('cours:emploi-du-temps-journalier')->dailyAt('06:00');
