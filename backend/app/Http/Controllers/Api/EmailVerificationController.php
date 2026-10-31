<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EmailVerificationController extends Controller
{
    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => 'required|string|size:64']);
        $userId = Cache::pull('email_verification_link:' . hash('sha256', $data['token']));
        if (!$userId || !$user = User::find($userId)) {
            return response()->json(['success' => false, 'message' => 'Link xác minh đã hết hạn hoặc đã được sử dụng.'], 410);
        }
        if (!$user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
        return response()->json(['success' => true]);
    }
}
