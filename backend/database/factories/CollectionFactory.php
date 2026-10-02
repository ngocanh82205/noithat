<?php

namespace Database\Factories;

use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionFactory extends Factory
{
    protected $model = Collection::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'subtitle' => fake()->optional()->sentence(),
            'description' => fake()->optional()->paragraph(),
            'banner_image' => null,
            'room_type' => fake()->randomElement(['living', 'dining', 'bedroom', 'office']),
            'is_featured' => fake()->boolean(20),
        ];
    }
}