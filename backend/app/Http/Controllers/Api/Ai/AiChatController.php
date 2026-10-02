<?php

namespace App\Http\Controllers\Api\Ai;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $message = trim($request->message);
        $lowerMsg = mb_strtolower($message, 'UTF-8');

        // 1. Check order tracking first (exact match, keep rule-based)
        if (preg_match('/GSL-[0-9A-Z-]+/i', $message, $matches)) {
            return $this->handleOrderTracking($matches[0]);
        }

        // 2. Try Gemini AI if configured
        if ($this->gemini->isConfigured()) {
            return $this->handleWithGemini($message, $lowerMsg);
        }

        // 3. Fallback to rule-based
        return $this->handleRuleBased($message, $lowerMsg);
    }

    protected function handleOrderTracking(string $orderCode): JsonResponse
    {
        $orderCode = strtoupper($orderCode);
        $order = Order::where('order_number', $orderCode)->with('items')->first();

        if ($order) {
            $statusText = match ($order->order_status) {
                'completed' => 'Đã hoàn thành giao hàng & nghiệm thu',
                'shipping' => 'Đang trên đường giao hàng & lắp đặt tận nhà',
                'confirmed' => 'Đã được KTS xác nhận, đang xuất kho gia công',
                default => 'Đang được tiếp nhận xử lý',
            };

            $reply = "Kính chào Quý khách! Đơn hàng **{$orderCode}** của Quý khách hiện đang ở trạng thái: **{$statusText}**.\n\n"
                . "• Người nhận: {$order->customer_name} ({$order->customer_phone})\n"
                . "• Địa chỉ: {$order->shipping_address}, {$order->shipping_city}\n"
                . "• Tổng thanh toán: " . number_format($order->total_amount, 0, ',', '.') . "₫\n\n"
                . "Đội ngũ chuyên viên vận chuyển của GS Luxury sẽ liên hệ trước 30 phút khi đến lắp đặt.";

            return response()->json([
                'success' => true,
                'meta' => [
                    'engine' => 'rule_based_v1',
                    'engine_description' => 'Tra cứu đơn hàng dựa trên quy tắc (exact match)',
                    'processed_at' => now()->toISOString(),
                ],
                'data' => [
                    'reply' => $reply,
                    'products' => [],
                    'action' => 'track_order',
                ],
            ]);
        }

        $reply = "GS Luxury chưa tìm thấy thông tin đơn hàng với mã **{$orderCode}**. Quý khách vui lòng kiểm tra lại mã vận đơn hoặc liên hệ Hotline **1900 8888** để được hỗ trợ tức thì.";
        return response()->json([
            'success' => true,
            'meta' => ['engine' => 'rule_based_v1', 'processed_at' => now()->toISOString()],
            'data' => ['reply' => $reply, 'products' => []],
        ]);
    }

    protected function handleWithGemini(string $message, string $lowerMsg): JsonResponse
    {
        // Get relevant products for context
        $products = $this->searchRelevantProducts($lowerMsg);
        $productContext = $this->formatProductsForAI($products);

        $systemPrompt = <<<PROMPT
Bạn là **Trợ lý AI GS Luxury** - chuyên gia tư vấn nội thất cao cấp tại Việt Nam.

**THÔNG TIN DOANH NGHIỆP:**
- Tên: GS Luxury (GS Luxury Studio)
- Chuyên: Nội thất may đo cao cấp (Sofa, Bàn ăn, Giường ngủ, Bàn trà, Đèn trang trí...)
- Chất liệu: Da bò Ý Tuscan, Gỗ sồi Bắc Mỹ/Oak, Đá Marble Carrara, Pha lê K9
- Bảo hành: 24-60 tháng, bảo dưỡng miễn phí hàng năm
- Giao hàng: White-Glove Delivery (mang tận phòng, lắp đặt, dọn dẹp), miễn phí đơn >50 triệu
- Dịch vụ: Khảo sát & Thiết kế 3D tại nhà miễn phí

**SẢN PHẨM CÓ SẴN (dữ liệu thực):**
{$productContext}

**HƯỚNG DẪN TRẢ LỜI:**
1. Trả lời bằng tiếng Việt, phong cách chuyên nghiệp, sang trọng, lịch sự
2. Nếu user hỏi về sản phẩm -> gợi ý từ danh sách trên, kèm giá, vật liệu, lý do phù hợp
3. Nếu user hỏi chính sách/bảo hành/giao hàng -> trả lời chính xác theo info trên
4. Nếu user hỏi tư vấn thiết kế -> mời đăng ký khảo sát tại nhà
5. KHÔNG bịa đặt sản phẩm không có trong danh sách
6. Giới hạn 3-4 câu, ngắn gọn, đi thẳng vào vấn đề
7. Cuối câu hỏi ngầm gợi mở rộng hội thoại

User: {$message}
PROMPT;

        $result = $this->gemini->generateContent($systemPrompt);

        if (isset($result['error'])) {
            Log::warning('Gemini failed, fallback to rule-based', ['error' => $result['error']]);
            return $this->handleRuleBased($message, $lowerMsg);
        }

        $reply = $result['text'] ?? 'Xin lỗi, em chưa hiểu ý Quý khách. Quý khách có thể hỏi về sofa, bàn ăn, giường ngủ, hoặc chính sách bảo hành/giao hàng nhé!';

        return response()->json([
            'success' => true,
            'meta' => [
                'engine' => 'gemini_1.5_flash',
                'engine_description' => 'Google Gemini 1.5 Flash AI',
                'processed_at' => now()->toISOString(),
            ],
            'data' => [
                'reply' => $reply,
                'products' => $products,
                'action' => null,
            ],
        ]);
    }

    protected function handleRuleBased(string $message, string $lowerMsg): JsonResponse
    {
        $reply = "";
        $suggestedProducts = [];
        $action = null;

        // Search products with keyword matching
        $query = Product::where('status', 'active')->where('stock_quantity', '>', 0)->with(['images', 'category']);

        if (str_contains($lowerMsg, 'sofa') || str_contains($lowerMsg, 'ghế')) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%sofa%')->orWhere('name', 'like', '%ghế%');
            });
        } elseif (str_contains($lowerMsg, 'bàn') || str_contains($lowerMsg, 'dining')) {
            $query->where('name', 'like', '%bàn%');
        } elseif (str_contains($lowerMsg, 'giường') || str_contains($lowerMsg, 'ngủ') || str_contains($lowerMsg, 'bedroom')) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%giường%')->orWhereHas('category', function ($c) {
                    $c->where('slug', 'bedroom');
                });
            });
        } elseif (str_contains($lowerMsg, 'đèn') || str_contains($lowerMsg, 'lighting')) {
            $query->where('name', 'like', '%đèn%');
        }

        if (str_contains($lowerMsg, 'da bò') || str_contains($lowerMsg, 'da ý') || str_contains($lowerMsg, 'leather')) {
            $query->where('material', 'like', '%da%');
        } elseif (str_contains($lowerMsg, 'gỗ') || str_contains($lowerMsg, 'gỗ sồi') || str_contains($lowerMsg, 'oak')) {
            $query->where('material', 'like', '%gỗ%');
        } elseif (str_contains($lowerMsg, 'đá') || str_contains($lowerMsg, 'marble') || str_contains($lowerMsg, 'cẩm thạch')) {
            $query->where('material', 'like', '%đá%');
        }

        if (preg_match('/([0-9]+)\s*(triệu|tr|m)/i', $lowerMsg, $priceMatches)) {
            $maxPrice = (float) $priceMatches[1] * 1000000;
            $query->where('price', '<=', $maxPrice);
        }

        $suggestedProducts = $query->limit(3)->get();

        if (str_contains($lowerMsg, 'chào') || str_contains($lowerMsg, 'hello') || str_contains($lowerMsg, 'hi')) {
            $reply = "Dạ, GS Luxury xin kính chào Quý khách! Em là Trợ lý Gợi ý Nội thất. Em có thể hỗ trợ Quý khách tìm kiếm sofa, bàn ăn, giường ngủ, đèn trang trí hoặc tư vấn theo ngân sách/không gian.";
            if ($suggestedProducts->isEmpty()) {
                $suggestedProducts = Product::where('is_bestseller', true)->with(['images', 'category'])->limit(2)->get();
            }
        } elseif (str_contains($lowerMsg, 'bảo hành') || str_contains($lowerMsg, 'chính sách')) {
            $reply = "Toàn bộ sản phẩm GS Luxury bảo hành **24-60 tháng** (khung gỗ, da bò Ý). Bảo dưỡng miễn phí hàng năm tại nhà.";
        } elseif (str_contains($lowerMsg, 'vận chuyển') || str_contains($lowerMsg, 'giao hàng') || str_contains($lowerMsg, 'lắp đặt')) {
            $reply = "GS Luxury giao hàng **White-Glove Delivery**: mang tận phòng, lắp đặt, dọn dẹp. Miễn phí đơn >50 triệu.";
        } elseif (str_contains($lowerMsg, 'tư vấn') || str_contains($lowerMsg, 'thiết kế') || str_contains($lowerMsg, 'khảo sát')) {
            $reply = "Quý khách đăng ký **Khảo sát & Thiết kế 3D tại nhà** miễn phí. KTS mang mẫu vật liệu, tư vấn phối cảnh trực quan.";
        } elseif ($suggestedProducts->isNotEmpty()) {
            $reply = "Dạ, dựa trên từ khóa Quý khách, em gợi ý các sản phẩm phù hợp:";
        } else {
            $reply = "Cảm ơn Quý khách! Hãy cho em biết sản phẩm mong muốn (sofa, bàn ăn, giường, đèn...), vật liệu (da, gỗ, đá) hoặc ngân sách nhé!";
            $suggestedProducts = Product::where('is_featured', true)->with(['images', 'category'])->limit(2)->get();
        }

        return response()->json([
            'success' => true,
            'meta' => [
                'engine' => 'rule_based_v1',
                'engine_description' => 'Fallback: Trợ lý hội thoại dựa trên quy tắc từ khóa',
                'processed_at' => now()->toISOString(),
            ],
            'data' => [
                'reply' => $reply,
                'products' => $suggestedProducts,
                'action' => $action,
            ],
        ]);
    }

    protected function searchRelevantProducts(string $lowerMsg): \Illuminate\Database\Eloquent\Collection
    {
        $query = Product::where('status', 'active')->where('stock_quantity', '>', 0)->with(['images', 'category']);

        if (str_contains($lowerMsg, 'sofa') || str_contains($lowerMsg, 'ghế')) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%sofa%')->orWhere('name', 'like', '%ghế%');
            });
        } elseif (str_contains($lowerMsg, 'bàn') || str_contains($lowerMsg, 'dining')) {
            $query->where('name', 'like', '%bàn%');
        } elseif (str_contains($lowerMsg, 'giường') || str_contains($lowerMsg, 'ngủ') || str_contains($lowerMsg, 'bedroom')) {
            $query->where(function ($q) {
                $q->where('name', 'like', '%giường%')->orWhereHas('category', fn($c) => $c->where('slug', 'bedroom'));
            });
        } elseif (str_contains($lowerMsg, 'đèn') || str_contains($lowerMsg, 'lighting')) {
            $query->where('name', 'like', '%đèn%');
        }

        if (str_contains($lowerMsg, 'da bò') || str_contains($lowerMsg, 'da ý') || str_contains($lowerMsg, 'leather')) {
            $query->where('material', 'like', '%da%');
        } elseif (str_contains($lowerMsg, 'gỗ') || str_contains($lowerMsg, 'gỗ sồi') || str_contains($lowerMsg, 'oak')) {
            $query->where('material', 'like', '%gỗ%');
        } elseif (str_contains($lowerMsg, 'đá') || str_contains($lowerMsg, 'marble') || str_contains($lowerMsg, 'cẩm thạch')) {
            $query->where('material', 'like', '%đá%');
        }

        if (preg_match('/([0-9]+)\s*(triệu|tr|m)/i', $lowerMsg, $priceMatches)) {
            $query->where('price', '<=', (float) $priceMatches[1] * 1000000);
        }

        return $query->limit(5)->get();
    }

    protected function formatProductsForAI(\Illuminate\Database\Eloquent\Collection $products): string
    {
        if ($products->isEmpty()) {
            return "Chưa có sản phẩm phù hợp trong kho.";
        }

        return $products->map(function ($p) {
            return "- **{$p->name}**: " . number_format($p->price, 0, ',', '.') . "₫ | {$p->material} | {$p->category?->name} | Còn {$p->stock_quantity}";
        })->implode("\n");
    }
}