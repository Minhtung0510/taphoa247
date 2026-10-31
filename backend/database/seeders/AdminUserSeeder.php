<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('ADMIN_INITIAL_PASSWORD');
        if (empty($password)) {
            $this->command?->error('CẢNH BÁO: Biến môi trường ADMIN_INITIAL_PASSWORD chưa được thiết lập!');
            $this->command?->line('Vui lòng thêm ADMIN_INITIAL_PASSWORD vào file .env (hoặc dùng php artisan admin:reset-password sau khi tạo).');
            throw new \RuntimeException('Thiếu ADMIN_INITIAL_PASSWORD trong .env. Tuyệt đối không sử dụng mật khẩu mặc định password123.');
        }

        User::updateOrCreate(
            ['email' => env('ADMIN_INITIAL_EMAIL', 'admin@taphoa247.io.vn')],
            [
                'name' => 'Administrator Tạp Hóa 247',
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
