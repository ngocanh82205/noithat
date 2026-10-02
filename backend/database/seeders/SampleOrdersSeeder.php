<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SampleOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@gmail.com')->first();
        $products = Product::all();
        $variants = ProductVariant::all();

        // Create 15 additional customers (skip if email exists)
        $newCustomers = [];
        for ($i = 1; $i <= 15; $i++) {
            $email = 'customer' . $i . '@test.com';
            $existing = User::where('email', $email)->first();
            if ($existing) {
                $newCustomers[] = $existing;
                continue;
            }
            $c = User::create([
                'name' => 'Khách Hàng Test ' . $i,
                'email' => $email,
                'phone' => '09' . str_pad($i, 9, '0', STR_PAD_LEFT),
                'role' => 'customer',
                'password' => Hash::make('password123'),
                'address' => 'Địa chỉ test ' . $i . ', Hà Nội',
                'email_verified_at' => now(),
            ]);
            $newCustomers[] = $c;
        }
        $this->command->info('Created ' . count($newCustomers) . ' new customers.');

        // Combine all customers
        $allCustomers = collect([$customer])->merge($newCustomers)->toArray();

        // Order statuses and their weights for distribution
        $statuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
        $weights = [10, 20, 20, 35, 15]; // More completed orders for revenue stats

        // Create 15 orders spread over last 60 days
        $totalOrders = 15;
        for ($i = 0; $i < $totalOrders; $i++) {
            $customer = $allCustomers[array_rand($allCustomers)];
            $product = $products->random();
            $variant = $variants->where('product_id', $product->id)->first();
            
            $quantity = rand(1, 3);
            $price = $variant ? $variant->price : $product->price;
            $subtotal = $price * $quantity;
            $shippingFee = $subtotal >= 10000000 ? 0 : 250000;
            $totalAmount = $subtotal + $shippingFee;

            // Pick status based on weights
            $rand = rand(1, 100);
            $cumWeight = 0;
            $status = 'completed';
            foreach ($weights as $idx => $weight) {
                $cumWeight += $weight;
                if ($rand <= $cumWeight) {
                    $status = $statuses[$idx];
                    break;
                }
            }

            // Random date within last 60 days
            $daysAgo = rand(0, 60);
            $createdAt = Carbon::today()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59), rand(0, 59));

            $orderNumber = 'GSL-' . $createdAt->format('Ymd') . '-' . strtoupper(Str::random(6));

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $customer['id'],
                'customer_name' => $customer['name'],
                'customer_email' => $customer['email'],
                'customer_phone' => $customer['phone'],
                'shipping_address' => $customer['address'],
                'shipping_city' => 'Hà Nội',
                'shipping_district' => 'Bắc Từ Liêm',
                'shipping_method' => 'standard',
                'notes' => '',
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'discount_amount' => 0,
                'coins_used' => 0,
                'coins_discount' => 0,
                'total_amount' => $totalAmount,
                'payment_method' => rand(1, 3) === 1 ? 'cod' : 'bank_transfer',
                'payment_status' => in_array($status, ['completed', 'shipping']) ? 'paid' : 'unpaid',
                'order_status' => $status,
                'tracking_code' => 'VN' . strtoupper(Str::random(8)) . 'GS',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // Create order item
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_name' => $variant?->name,
                'product_image' => $product->images->first()?->image_url,
                'price' => $price,
                'quantity' => $quantity,
                'total_price' => $subtotal,
            ]);
        }
        $this->command->info('Created ' . $totalOrders . ' sample orders with various statuses.');
    }
}