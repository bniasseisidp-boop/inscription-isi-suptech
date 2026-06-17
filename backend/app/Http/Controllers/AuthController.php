<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé. Contactez l\'administration.'], 403);
        }

        $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

        $studentData = null;
        if ($user->isStudent()) {
            $studentData = Student::where('user_id', $user->id)
                ->with(['filiere', 'license'])
                ->first();
        }

        return response()->json([
            'token'   => $token,
            'user'    => $user,
            'student' => $studentData,
        ]);
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
}
