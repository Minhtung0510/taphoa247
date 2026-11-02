<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminImageController extends Controller
{
    public function __invoke(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120|dimensions:max_width=8000,max_height=8000']);
        $file = $request->file('image');
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
            default => abort(422, 'Định dạng ảnh không được hỗ trợ.'),
        };
        $name = Str::uuid() . '.' . $extension;
        $file->move(public_path('uploads/catalog'), $name);
        return response()->json(['success' => true, 'data' => ['url' => $request->getSchemeAndHttpHost() . '/uploads/catalog/' . $name]], 201);
    }
}
