<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code'               => strtoupper($this->faker->unique()->bothify('??####')),
            'description'        => $this->faker->sentence(),
            'discount_type'      => 'percent',
            'discount_value'     => $this->faker->numberBetween(5, 30),
            'max_discount_amount'=> null,
            'min_order_amount'   => 0,
            'usage_limit'        => 100,
            'used_count'         => 0,
            'expires_at'         => now()->addDays(30),
            'is_active'          => true,
        ];
    }
}
