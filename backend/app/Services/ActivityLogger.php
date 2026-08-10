<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    /**
     * Enregistre une action dans le journal d'audit (visible par l'admin).
     * $subject : le modèle concerné (Payment, Student, User...), optionnel.
     */
    public static function log(?User $user, string $action, string $description, ?Model $subject = null, array $meta = []): void
    {
        try {
            ActivityLog::create([
                'user_id'      => $user?->id,
                'role'         => $user?->role,
                'action'       => $action,
                'description'  => $description,
                'subject_type' => $subject ? get_class($subject) : null,
                'subject_id'   => $subject?->id,
                'meta'         => $meta ?: null,
                'created_at'   => now(),
            ]);
        } catch (\Exception $e) {
            \Log::warning('ActivityLogger: ' . $e->getMessage());
        }
    }
}
