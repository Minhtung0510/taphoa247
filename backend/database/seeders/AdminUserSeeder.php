<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@taphoa247.io.vn'],
            [
                'name' => 'Administrator Tạp Hóa 247',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );
    }
}
