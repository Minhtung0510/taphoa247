<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPasswordCommand extends Command
{
    protected $signature = 'admin:reset-password {email? : Địa chỉ email tài khoản admin}';
    protected $description = 'Đặt lại mật khẩu an toàn cho tài khoản Quản trị viên (Admin)';

    public function handle(): int
    {
        $email = $this->argument('email');
        if (empty($email)) {
            $email = $this->ask('Nhập email tài khoản admin cần đổi mật khẩu:');
        }

        $email = strtolower(trim((string) $email));
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("Không tìm thấy tài khoản với email: {$email}");
            return Command::FAILURE;
        }

        $password = $this->secret('Nhập mật khẩu mới:');
        if (empty($password) || strlen($password) < 8) {
            $this->error('Mật khẩu phải có tối thiểu 8 ký tự!');
            return Command::FAILURE;
        }

        $confirm = $this->secret('Xác nhận lại mật khẩu mới:');
        if ($password !== $confirm) {
            $this->error('Mật khẩu xác nhận không khớp!');
            return Command::FAILURE;
        }

        $user->password = Hash::make($password);
        $user->save();

        // Thu hồi toàn bộ token cũ để buộc đăng nhập lại
        $user->tokens()->delete();

        $this->info("✅ Đã đặt lại mật khẩu thành công cho tài khoản {$email}. Toàn bộ phiên đăng nhập cũ đã được thu hồi.");
        return Command::SUCCESS;
    }
}
