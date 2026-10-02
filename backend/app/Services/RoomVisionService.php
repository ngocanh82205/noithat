<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Phân tích ảnh căn phòng bằng Gemini Vision và chọn sản phẩm PHÙ HỢP từ catalog thật.
 *
 * Kết quả của AI không được tin tuyệt đối: chỉ giữ product_id có trong catalog (còn bán, còn hàng),
 * mã màu đúng định dạng, toạ độ trong khung ảnh. Không hợp lệ -> trả null để controller dùng gợi ý dự phòng.
 */
class RoomVisionService
{
    public const MAX_CATALOG_ITEMS = 60;

    public function __construct(protected GeminiService $gemini)
    {
    }

    public function isAvailable(): bool
    {
        return $this->gemini->isConfigured();
    }

    /**
     * @return array{analysis: array, products: Collection, model: string}|array{error: string, not_a_room?: bool}|null
     */
    public function analyze(string $base64Image, string $mimeType, string $userPrompt = ''): ?array
    {
        $catalog = $this->catalog();
        if ($catalog->isEmpty()) {
            return null;
        }

        // Cùng ảnh + cùng yêu cầu + cùng catalog -> dùng lại kết quả (tiết kiệm lượt gọi miễn phí)
        $cacheKey = 'room_vision:' . sha1($base64Image . '|' . $userPrompt . '|' . $catalog->pluck('id')->implode(','));
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $this->hydrate($cached, $catalog);
        }

        $result = $this->gemini->generateMultimodalContent(
            $this->buildPrompt($catalog, $userPrompt),
            $base64Image,
            $mimeType,
            ['json' => true]
        );

        if (isset($result['error'])) {
            Log::info('Room vision fell back to rule-based', ['reason' => $result['error']]);
            return null;
        }

        $parsed = $this->decode($result['text'] ?? '');
        if ($parsed === null) {
            Log::warning('Room vision returned unparseable JSON');
            return null;
        }

        if (($parsed['is_room'] ?? true) === false) {
            return ['error' => 'not_a_room', 'not_a_room' => true];
        }

        $clean = $this->sanitize($parsed, $catalog);
        if ($clean === null) {
            return null;
        }
        $clean['model'] = $result['model'] ?? '';

        Cache::put($cacheKey, $clean, now()->addDay());

        return $this->hydrate($clean, $catalog);
    }

    protected function catalog(): Collection
    {
        return Product::with(['images', 'category'])
            ->where('status', 'active')
            ->where('stock_quantity', '>', 0)
            ->orderByDesc('is_featured')
            ->orderByDesc('is_bestseller')
            ->take(self::MAX_CATALOG_ITEMS)
            ->get();
    }

    protected function buildPrompt(Collection $catalog, string $userPrompt): string
    {
        $lines = $catalog->map(fn (Product $p) => sprintf(
            '- ID:%d | %s | %s | %s₫ | %s | %s',
            $p->id,
            $p->name,
            $p->category?->name ?? 'Nội thất',
            number_format((float) $p->price, 0, ',', '.'),
            $p->material ?: 'không rõ chất liệu',
            $p->dimensions ?: 'không rõ kích thước'
        ))->implode("\n");

        $request = trim($userPrompt) !== '' ? trim($userPrompt) : 'Không có yêu cầu cụ thể — hãy tự đề xuất món phù hợp nhất.';

        return <<<PROMPT
Bạn là kiến trúc sư nội thất của GS Luxury. Hãy NHÌN KỸ bức ảnh căn phòng đính kèm và:
1. Xác định loại phòng, phong cách, ánh sáng, bảng màu chủ đạo THỰC TẾ trong ảnh.
2. Ước lượng diện tích dựa trên những gì thấy trong ảnh (ghi rõ là ước lượng).
3. Tìm vùng trống hợp lý để đặt món nội thất chính, trả về toạ độ theo % chiều ngang (x) và chiều dọc (y) của ảnh.
4. Chọn 3-5 sản phẩm PHÙ HỢP NHẤT với căn phòng và yêu cầu của khách, CHỈ chọn từ danh sách dưới đây (dùng đúng ID).
   Không phù hợp thì chọn ít hơn, không được bịa ID.

Yêu cầu của khách: "{$request}"

DANH SÁCH SẢN PHẨM CÓ SẴN:
{$lines}

Trả về DUY NHẤT một JSON (tiếng Việt, ngắn gọn) theo đúng cấu trúc:
{
  "is_room": true,
  "room_type": "vd: Phòng khách căn hộ",
  "style": "vd: Hiện đại tối giản",
  "estimated_area": "vd: khoảng 20-25 m²",
  "lighting": "1 câu nhận xét ánh sáng trong ảnh",
  "color_palette": [{"name": "Trắng kem", "hex": "#F5F0E8"}],
  "free_space": {"x": 50, "y": 65, "description": "vị trí trống gợi ý đặt đồ"},
  "summary": "2 câu nhận xét tổng quan và hướng phối",
  "recommendations": [{"product_id": 1, "reason": "lý do cụ thể gắn với căn phòng trong ảnh"}]
}
Nếu ảnh KHÔNG phải ảnh căn phòng/không gian nội thất, trả về {"is_room": false}.
PROMPT;
    }

    protected function decode(string $text): ?array
    {
        $text = trim($text);
        if (preg_match('/```(?:json)?\s*(.*?)```/s', $text, $m)) {
            $text = trim($m[1]);
        }
        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $data = json_decode(substr($text, $start, $end - $start + 1), true);

        return is_array($data) ? $data : null;
    }

    protected function sanitize(array $raw, Collection $catalog): ?array
    {
        $validIds = $catalog->pluck('id')->all();

        $recommendations = collect($raw['recommendations'] ?? [])
            ->filter(fn ($r) => is_array($r) && in_array((int) ($r['product_id'] ?? 0), $validIds, true))
            ->unique(fn ($r) => (int) $r['product_id'])
            ->take(5)
            ->map(fn ($r) => [
                'product_id' => (int) $r['product_id'],
                'reason' => $this->text($r['reason'] ?? '', 220) ?: 'Phù hợp với không gian trong ảnh.',
            ])
            ->values()
            ->all();

        if (count($recommendations) === 0) {
            return null;
        }

        $palette = collect($raw['color_palette'] ?? [])
            ->filter(fn ($c) => is_array($c) && preg_match('/^#[0-9A-Fa-f]{6}$/', (string) ($c['hex'] ?? '')))
            ->take(5)
            ->map(fn ($c) => ['name' => $this->text($c['name'] ?? '', 40), 'hex' => strtoupper($c['hex'])])
            ->values()
            ->all();

        $free = is_array($raw['free_space'] ?? null) ? $raw['free_space'] : [];
        $x = is_numeric($free['x'] ?? null) ? (float) $free['x'] : null;
        $y = is_numeric($free['y'] ?? null) ? (float) $free['y'] : null;

        return [
            'room_type' => $this->text($raw['room_type'] ?? '', 80) ?: 'Không gian nội thất',
            'style' => $this->text($raw['style'] ?? '', 80),
            'estimated_area' => $this->text($raw['estimated_area'] ?? '', 40),
            'lighting' => $this->text($raw['lighting'] ?? '', 200),
            'summary' => $this->text($raw['summary'] ?? '', 400),
            'color_palette' => $palette,
            'placement' => ($x !== null && $y !== null) ? [
                // giữ trong khung ảnh giống giới hạn khi khách tự bấm chọn vị trí
                'x' => round(max(12, min(88, $x)), 1),
                'y' => round(max(20, min(80, $y)), 1),
                'description' => $this->text($free['description'] ?? '', 160),
            ] : null,
            'recommendations' => $recommendations,
        ];
    }

    protected function hydrate(array $clean, Collection $catalog): array
    {
        $byId = $catalog->keyBy('id');
        $products = collect($clean['recommendations'])
            ->map(fn ($r) => ['product' => $byId->get($r['product_id']), 'reason' => $r['reason']])
            ->filter(fn ($r) => $r['product'] !== null)
            ->values();

        return ['analysis' => $clean, 'products' => $products, 'model' => $clean['model'] ?? ''];
    }

    protected function text(mixed $value, int $max): string
    {
        $value = trim(strip_tags((string) $value));

        return mb_strlen($value) > $max ? rtrim(mb_substr($value, 0, $max - 1)) . '…' : $value;
    }
}
