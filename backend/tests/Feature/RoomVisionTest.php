<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RoomVisionTest extends TestCase
{
    use RefreshDatabase;

    protected Product $sofa;
    protected Product $table;
    protected string $image;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['services.gemini.api_key' => 'test-key', 'services.gemini.model' => null]);

        $this->sofa = Product::factory()->active()->create(['name' => 'Sofa Test', 'stock_quantity' => 5]);
        $this->table = Product::factory()->active()->create(['name' => 'Bàn Test', 'stock_quantity' => 5]);

        // Ảnh JPEG thật nhỏ (kiểm tra chữ ký file)
        $img = imagecreatetruecolor(64, 48);
        ob_start();
        imagejpeg($img);
        $this->image = 'data:image/jpeg;base64,' . base64_encode(ob_get_clean());
    }

    private function geminiReply(array $json): array
    {
        return ['candidates' => [['content' => ['parts' => [['text' => json_encode($json, JSON_UNESCAPED_UNICODE)]]]]]];
    }

    private function validAnalysis(array $overrides = []): array
    {
        return array_merge([
            'is_room' => true,
            'room_type' => 'Phòng làm việc tập thể',
            'style' => 'Hiện đại công năng',
            'estimated_area' => 'khoảng 40-50 m²',
            'lighting' => 'Ánh sáng đèn trần trắng, đều',
            'color_palette' => [['name' => 'Trắng', 'hex' => '#f5f5f5'], ['name' => 'sai', 'hex' => 'blue']],
            'free_space' => ['x' => 5, 'y' => 95, 'description' => 'Góc trái phía trước'],
            'summary' => 'Không gian đông người, nên chọn đồ gọn.',
            'recommendations' => [
                ['product_id' => $this->table->id, 'reason' => 'Mặt bàn rộng cho nhóm làm việc'],
                ['product_id' => 999999, 'reason' => 'ID bịa phải bị loại'],
                ['product_id' => $this->sofa->id, 'reason' => 'Ghế nghỉ cho góc chờ'],
            ],
        ], $overrides);
    }

    /** @test */
    public function image_is_analyzed_by_gemini_and_only_real_products_are_returned()
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiReply($this->validAnalysis()))]);

        $res = $this->postJson('/api/visual-search', ['prompt' => 'phối đồ', 'image_base64' => $this->image])->assertOk();

        $res->assertJsonPath('data.engine', 'gemini_vision')
            ->assertJsonPath('data.image_analyzed', true)
            ->assertJsonPath('data.detected_room_type', 'Phòng làm việc tập thể')
            ->assertJsonPath('data.products.0.id', $this->table->id)
            ->assertJsonPath('data.products.0.match_reason', 'Mặt bàn rộng cho nhóm làm việc')
            ->assertJsonPath('data.products.0.similarity_score', null)
            ->assertJsonCount(2, 'data.products')            // ID bịa bị loại
            ->assertJsonCount(1, 'data.palette')             // mã màu sai bị loại
            ->assertJsonPath('data.palette.0.hex', '#F5F5F5')
            ->assertJsonPath('data.placement.x', 12)         // toạ độ được kẹp trong khung
            ->assertJsonPath('data.placement.y', 80);

        Http::assertSent(fn ($req) => $req->hasHeader('x-goog-api-key', 'test-key')
            && !str_contains($req->url(), 'key=')
            && isset($req['contents'][0]['parts'][1]['inline_data']['data']));
    }

    /** @test */
    public function same_image_is_served_from_cache_without_calling_gemini_again()
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiReply($this->validAnalysis()))]);

        $this->postJson('/api/visual-search', ['image_base64' => $this->image])->assertOk();
        $this->postJson('/api/visual-search', ['image_base64' => $this->image])->assertOk()
            ->assertJsonPath('data.engine', 'gemini_vision');

        Http::assertSentCount(1);
    }

    /** @test */
    public function retired_model_falls_back_to_next_model()
    {
        Http::fake([
            'generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:*' => Http::response(['error' => ['message' => 'models/gemini-2.5-flash is not found']], 404),
            'generativelanguage.googleapis.com/*' => Http::response($this->geminiReply($this->validAnalysis())),
        ]);

        $this->postJson('/api/visual-search', ['image_base64' => $this->image])
            ->assertOk()
            ->assertJsonPath('data.engine', 'gemini_vision');
    }

    /** @test */
    public function gemini_failure_falls_back_to_keyword_suggestions_with_honest_label()
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => ['message' => 'quota']], 429)]);

        $res = $this->postJson('/api/visual-search', ['prompt' => 'sofa phòng khách', 'image_base64' => $this->image])->assertOk();

        $res->assertJsonPath('data.engine', 'rule_based')
            ->assertJsonPath('data.image_analyzed', false)
            ->assertJsonPath('data.engine_label', 'AI chưa phân tích được ảnh lúc này — đang gợi ý theo mô tả');
    }

    /** @test */
    public function non_room_image_is_rejected_with_clear_message()
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiReply(['is_room' => false]))]);

        $this->postJson('/api/visual-search', ['image_base64' => $this->image])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Ảnh này có vẻ không phải ảnh một căn phòng. Vui lòng chụp toàn cảnh không gian cần phối đồ.');
    }

    /** @test */
    public function invalid_image_is_rejected()
    {
        Http::fake();

        $this->postJson('/api/visual-search', ['image_base64' => 'data:image/jpeg;base64,' . base64_encode(str_repeat('x', 500))])
            ->assertStatus(422);
        $this->postJson('/api/visual-search', ['image_base64' => 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='])
            ->assertStatus(422);

        Http::assertNothingSent();
    }

    /** @test */
    public function without_api_key_suggestions_are_keyword_based_and_labelled_so()
    {
        config(['services.gemini.api_key' => '']);
        Http::fake();

        $this->postJson('/api/visual-search', ['prompt' => 'sofa', 'image_base64' => $this->image])
            ->assertOk()
            ->assertJsonPath('data.engine', 'rule_based')
            ->assertJsonPath('data.engine_label', 'Gợi ý theo từ khoá trong mô tả (chưa bật AI phân tích ảnh)');

        Http::assertNothingSent();
    }
}
