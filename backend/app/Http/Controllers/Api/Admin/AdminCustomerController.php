<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class AdminCustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = User::withCount('orders')
            ->withSum(['orders as total_spent' => function ($q) {
                $q->where('status', '!=', 'cancelled');
            }], 'total_amount')
            ->latest();

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            });
        }

        $customers = $query->paginate(15);

        // Add tier calculation
        $data = collect($customers->items())->map(function ($user) {
            $spent = (float)($user->total_spent ?? 0);
            $tier = 'Đồng (Standard)';
            if ($spent >= 200000000) {
                $tier = 'Kim Cương (Diamond VIP)';
            } elseif ($spent >= 100000000) {
                $tier = 'Vàng (Gold VIP)';
            } elseif ($spent >= 30000000) {
                $tier = 'Bạc (Silver VIP)';
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
                'orders_count' => $user->orders_count,
                'total_spent' => $spent,
                'membership_tier' => $tier,
                'created_at' => $user->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'total' => $customers->total(),
            ]
        ]);
    }
}
