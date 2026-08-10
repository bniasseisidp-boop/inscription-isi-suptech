<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Le super admin a un accès total à toutes les routes protégées par rôle,
        // quel que soit le rôle listé sur la route (contrôle total demandé).
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return $next($request);
    }
}
