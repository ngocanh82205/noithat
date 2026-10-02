<?php

namespace App\Http\Controllers\Api\Reward;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LuckyWheelController extends Controller
{
    /**
     * 8 ô của vòng quay (thứ tự phải khớp WHEEL_SEGMENTS ở frontend/components/MiniGameWheel.tsx).
     * weight = tỷ lệ trúng (%), tổng = 100.
     */
    public const SEGMENTS = [
        ['coins' => 0, 'weight' => 20],
        ['coins' => 10, 'weight' => 15],
        ['coins' => 20, 'weight' => 15],
        ['coins' => 0, 'weight' => 20],
        ['coins' => 50, 'weight' => 9],
        ['coins' => 10, 'weight' => 15],
        ['coins' => 100, 'weight' => 4.5],
        ['coins' => 200, 'weight' => 1.5],
    ];

    // Trạng thái lượt quay hôm nay của người dùng
    public function status(Request $request): JsonResponse
    {
        $user = User::findOrFail($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => [
                'can_spin' => !$this->hasSpunToday($user),
                'coins' => (int) $user->coins,
            ],
        ]);
    }

    // Quay thưởng: server chọn ô trúng, cộng xu và ghi nhận lượt quay (1 lượt/ngày)
    public function spin(Request $request): JsonResponse
    {
        $result = DB::transaction(function () use ($request) {
            $user = User::where('id', $request->user()->id)->lockForUpdate()->first();

            if ($this->hasSpunToday($user)) {
                return null;
            }

            $index = $this->pickSegment();
            $coins = self::SEGMENTS[$index]['coins'];

            $user->last_spin_at = now();
            if ($coins > 0) {
                $user->coins = (int) $user->coins + $coins;
            }
            $user->save();

            return ['segment_index' => $index, 'coins_won' => $coins, 'coins' => (int) $user->coins];
        });

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Hôm nay bạn đã sử dụng hết lượt quay. Lượt quay mới sẽ mở lại vào ngày mai!',
            ], 429);
        }

        return response()->json([
            'success' => true,
            'message' => $result['coins_won'] > 0
                ? "Chúc mừng! Bạn nhận được {$result['coins_won']} GS Coins."
                : 'Chúc bạn may mắn lần sau!',
            'data' => $result,
        ]);
    }

    private function hasSpunToday(User $user): bool
    {
        return $user->last_spin_at !== null && $user->last_spin_at->isSameDay(now());
    }

    private function pickSegment(): int
    {
        // Quay theo trọng số với độ chính xác 0.1%
        $roll = random_int(1, 1000) / 10;
        $cumulative = 0;
        foreach (self::SEGMENTS as $index => $segment) {
            $cumulative += $segment['weight'];
            if ($roll <= $cumulative) {
                return $index;
            }
        }

        return 0;
    }
}
