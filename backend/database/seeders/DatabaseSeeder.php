<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);

        if (Category::count() === 0) {
            $this->call(FurnitureSeeder::class);
        } else {
            $this->command->info('Furniture data already exists; skipping FurnitureSeeder.');
        }

        if (Order::count() === 0) {
            $this->call(SampleOrdersSeeder::class);
        } else {
            $this->command->info('Sample orders already exist; skipping SampleOrdersSeeder.');
        }
    }
}
