<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Seeder cũ trỏ tới /images/chair-1.jpeg nhưng file thật là chair-1.jpg -> ảnh sản phẩm bị vỡ.
     */
    public function up(): void
    {
        $this->replacePath('/images/chair-1.jpeg', '/images/chair-1.jpg');
    }

    public function down(): void
    {
        // Không khôi phục đường dẫn sai.
    }

    private function replacePath(string $from, string $to): void
    {
        $columns = [
            'product_images' => 'image_url',
            'product_variants' => 'image_url',
            'order_items' => 'product_image',
            'categories' => 'image',
            'collections' => 'image',
        ];

        foreach ($columns as $table => $column) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, $column)) {
                DB::table($table)->where($column, $from)->update([$column => $to]);
            }
        }
    }
};
