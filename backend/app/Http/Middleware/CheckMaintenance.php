<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckMaintenance
{
    /** Routes toujours accessibles même en maintenance (connexion, statut, admin). */
    private const EXEMPTES = ['login', 'maintenance-status', 'forgot-password', 'reset-password', 'verify-2fa', 'resend-2fa'];

    public function handle(Request $request, Closure $next): mixed
    {
        if (in_array($request->path(), array_map(fn ($r) => 'api/' . $r, self::EXEMPTES), true)) {
            return $next($request);
        }

        // Seul le super admin échappe au mode maintenance — un admin normal reste bloqué
        // lui aussi, la maintenance est un verrou total contrôlé par une seule personne.
        $user = $request->user();
        if ($user && $user->role === 'super_admin') {
            return $next($request);
        }

        $actif = DB::table('site_settings')->where('cle', 'maintenance_mode')->value('valeur') === '1';
        if ($actif) {
            $message = DB::table('site_settings')->where('cle', 'maintenance_message')->value('valeur')
                ?: 'La plateforme est temporairement en maintenance. Merci de réessayer plus tard.';
            return response()->json(['message' => $message, 'maintenance' => true], 503);
        }

        return $next($request);
    }
}
