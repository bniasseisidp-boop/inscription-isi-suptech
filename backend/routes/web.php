<?php

use Illuminate\Support\Facades\Route;

// API-only backend — pas d'interface web, tout passe par routes/api.php.
Route::get('/', fn () => response()->json(['app' => 'ISI SUPTECH Inscription API', 'status' => 'ok']));
