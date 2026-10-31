<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $suffix = strtoupper(Str::random(8));
        return [
            'order_code'      => 'ACC-' . $suffix,
            'access_token'    => Str::random(40),
            'user_id'         => null,
            'customer_name'   => $this->faker->name(),
            'customer_email'  => $this->faker->safeEmail(),
            'customer_phone'  => '09' . $this->faker->numerify('########'),
            'memo'            => 'ACC-' . $suffix,
            'coupon_code'     => null,
            'discount_amount' => 0,
            'original_amount' => 50000,
            'total_amount'    => 50000,
            'status'          => 'pending',
            'payment_gateway' => 'web2m',
            'qr_url'          => null,
            'delivery_format' => 'inline',
            'paid_at'         => null,
            'expires_at'      => now()->addMinutes(15),
        ];
    }

    /** Trạng thái đơn đã hết hạn */
    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subMinutes(1)]);
    }
}
