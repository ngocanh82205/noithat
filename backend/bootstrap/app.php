<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Render / reverse proxy kết thúc HTTPS phía trước: tin X-Forwarded-* để asset()/url() sinh https://
        // (nếu không, link ảnh upload thành http:// và bị trình duyệt chặn trên trang https).
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Mọi lỗi của API trả về cùng một dạng {success:false, message} bằng tiếng Việt,
        // không lộ tên model / đường dẫn / thông điệp nội bộ cho người dùng.
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (!$request->is('api/*') && !$request->expectsJson()) {
                return null; // trang web thường: để Laravel xử lý mặc định
            }

            $json = fn (string $message, int $status, array $extra = []) => response()->json(
                array_merge(['success' => false, 'message' => $message], $extra),
                $status
            );

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                $errors = $e->errors();
                $first = collect($errors)->flatten()->first();
                return $json($first ?: 'Dữ liệu không hợp lệ.', $e->status, ['errors' => $errors]);
            }
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return $json('Vui lòng đăng nhập để tiếp tục.', 401);
            }
            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
                return $json('Bạn không có quyền thực hiện thao tác này.', 403);
            }
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return $json('Không tìm thấy dữ liệu yêu cầu.', 404);
            }
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                return $json('Phương thức yêu cầu không được hỗ trợ.', 405);
            }
            if ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
                return $json('Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.', 429);
            }
            if ($e instanceof \Illuminate\Http\Exceptions\PostTooLargeException) {
                return $json('Dữ liệu tải lên quá lớn.', 413);
            }
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                return $json($e->getMessage() ?: 'Yêu cầu không hợp lệ.', $e->getStatusCode());
            }

            // Lỗi không lường trước: chi tiết chỉ hiện khi APP_DEBUG=true (máy dev), còn lại ghi log
            if (config('app.debug')) {
                return null;
            }
            return $json('Hệ thống đang bận, vui lòng thử lại sau.', 500);
        });
    })->create();