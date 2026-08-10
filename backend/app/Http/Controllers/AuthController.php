<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\TwoFactorChallenge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message'    => 'Aucun compte trouvé avec cet email.',
                'no_account' => true,
            ], 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Mot de passe incorrect.'],
            ]);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé. Contactez l\'administration.'], 403);
        }

        if ($this->needsTwoFactor($user)) {
            return response()->json(array_merge(
                ['requires_2fa' => true],
                $this->issueTwoFactorChallenge($user)
            ));
        }

        return response()->json($this->buildSessionResponse($user));
    }

    /** Le compte est concerné par la 2FA obligatoire si elle a été activée par le
     *  super admin après la dernière vérification confirmée par cet utilisateur
     *  (ou s'il n'en a encore jamais fait une depuis l'activation). */
    private function needsTwoFactor(User $user): bool
    {
        $since = DB::table('site_settings')->where('cle', 'force_2fa_since')->value('valeur');
        if (!$since) return false;

        return !$user->two_factor_confirmed_at || $user->two_factor_confirmed_at->lt(\Carbon\Carbon::parse($since));
    }

    /** Génère un code à 6 chiffres, l'envoie par email et crée un jeton de
     *  challenge temporaire (le client ne reçoit jamais l'id utilisateur directement). */
    private function issueTwoFactorChallenge(User $user): array
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'two_factor_code'            => Hash::make($code),
            'two_factor_code_expires_at' => now()->addMinutes(10),
        ])->save();

        TwoFactorChallenge::where('user_id', $user->id)->delete();
        $token = Str::random(48);
        TwoFactorChallenge::create([
            'token'      => $token,
            'user_id'    => $user->id,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($user->email)->send(new \App\Mail\TwoFactorCodeMail($code));
        } catch (\Exception $e) {
            \Log::warning('Email code 2FA: ' . $e->getMessage());
        }

        $masked = preg_replace('/^(.).*(@.*)$/', '$1***$2', $user->email);

        return ['challenge' => $token, 'email_masque' => $masked];
    }

    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'challenge' => 'required|string',
            'code'      => 'required|string',
        ]);

        $challenge = TwoFactorChallenge::where('token', $request->challenge)
            ->where('expires_at', '>', now())
            ->first();

        if (!$challenge) {
            return response()->json(['message' => 'Session de vérification expirée. Reconnectez-vous.'], 422);
        }

        $user = $challenge->user;

        if (!$user->two_factor_code || !$user->two_factor_code_expires_at
            || $user->two_factor_code_expires_at->isPast()
            || !Hash::check($request->code, $user->two_factor_code)) {
            return response()->json(['message' => 'Code invalide ou expiré.'], 422);
        }

        $user->forceFill([
            'two_factor_code'            => null,
            'two_factor_code_expires_at' => null,
            'two_factor_confirmed_at'    => now(),
        ])->save();

        $challenge->delete();

        return response()->json($this->buildSessionResponse($user));
    }

    public function resendTwoFactor(Request $request)
    {
        $request->validate(['challenge' => 'required|string']);

        $challenge = TwoFactorChallenge::where('token', $request->challenge)
            ->where('expires_at', '>', now())
            ->first();

        if (!$challenge) {
            return response()->json(['message' => 'Session de vérification expirée. Reconnectez-vous.'], 422);
        }

        $challenge->delete();
        $result = $this->issueTwoFactorChallenge($challenge->user);

        return response()->json(['message' => 'Un nouveau code a été envoyé.', 'challenge' => $result['challenge']]);
    }

    private function buildSessionResponse(User $user): array
    {
        $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

        $studentData = null;
        if ($user->isStudent()) {
            $studentData = Student::where('user_id', $user->id)
                ->with(['filiere', 'license'])
                ->first();
        }

        return [
            'token'   => $token,
            'user'    => $user,
            'student' => $studentData,
        ];
    }

    /** Envoie le lien de réinitialisation par email — toujours la même réponse, qu'un
     *  compte existe ou non pour cet email, pour ne pas révéler quels emails sont inscrits. */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        if (User::where('email', $request->email)->exists()) {
            Password::sendResetLink($request->only('email'));
        }

        return response()->json([
            'message' => "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $studentData = null;

        if ($user->isStudent()) {
            $studentData = Student::where('user_id', $user->id)
                ->with(['filiere', 'license', 'card', 'notifications' => function ($q) {
                    $q->where('lu', false)->latest()->take(5);
                }])
                ->first();
        }

        return response()->json([
            'user'    => $user,
            'student' => $studentData,
        ]);
    }

    /** Photo de profil du compte connecté (staff : admin, super admin, caisse, accueil…). */
    public function updatePhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);

        $user = $request->user();

        if ($user->photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->photo)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo);
        }

        $path = $request->file('photo')->store('profils', 'public');
        $user->forceFill(['photo' => $path])->save();

        return response()->json(['message' => 'Photo mise à jour !', 'user' => $user->fresh()]);
    }

    /** Changement de mot de passe pour le compte connecté — exige l'ancien mot de passe. */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mot de passe actuel incorrect.'],
            ]);
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }
}
