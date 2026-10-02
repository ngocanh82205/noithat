<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    /**
     * Các model Flash thử lần lượt. Google định kỳ ngừng model cũ (vd. gemini-1.5-flash đã ngừng),
     * nên khi một model báo "không tồn tại" thì tự chuyển sang model kế tiếp thay vì hỏng tính năng.
     */
    public const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

    protected const WORKING_MODEL_CACHE_KEY = 'gemini.working_model';

    public function __construct()
    {
        $this->apiKey = trim((string) config('services.gemini.api_key', ''));
        // Cho phép trỏ sang máy chủ khác (proxy / máy chủ giả khi kiểm thử); mặc định là Google
        $this->baseUrl = rtrim((string) config('services.gemini.base_url') ?: $this->baseUrl, '/');
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Danh sách model sẽ thử: model đã chạy được gần nhất -> model cấu hình -> các model dự phòng.
     */
    protected function candidateModels(): array
    {
        $configured = trim((string) config('services.gemini.model', ''));
        $remembered = Cache::get(self::WORKING_MODEL_CACHE_KEY);

        return array_values(array_unique(array_filter([
            $remembered,
            $configured,
            ...self::MODEL_FALLBACKS,
        ])));
    }

    /**
     * Gọi generateContent. Trả về ['text' => ..., 'model' => ...] hoặc ['error' => ..., 'status' => ...].
     */
    protected function generate(array $parts, array $generationConfig, int $timeout): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API key not configured', 'status' => 0];
        }

        $lastError = ['error' => 'No Gemini model available', 'status' => 0];

        foreach ($this->candidateModels() as $model) {
            try {
                $response = Http::timeout($timeout)
                    ->withHeaders([
                        'Content-Type' => 'application/json',
                        // Key gửi qua header thay vì query string để không lộ trong log truy cập
                        'x-goog-api-key' => $this->apiKey,
                    ])
                    ->post("{$this->baseUrl}/{$model}:generateContent", [
                        'contents' => [['role' => 'user', 'parts' => $parts]],
                        'generationConfig' => $generationConfig,
                    ]);
            } catch (\Throwable $e) {
                Log::warning('Gemini request exception', ['model' => $model, 'message' => $e->getMessage()]);
                return ['error' => 'Không kết nối được Gemini', 'status' => 0];
            }

            if ($response->successful()) {
                $text = $this->extractText($response->json());
                if ($text === null) {
                    Log::warning('Gemini returned no text', [
                        'model' => $model,
                        'finish' => $response->json('candidates.0.finishReason'),
                        'block' => $response->json('promptFeedback.blockReason'),
                    ]);
                    return ['error' => 'Gemini không trả về nội dung', 'status' => 200];
                }
                Cache::put(self::WORKING_MODEL_CACHE_KEY, $model, now()->addHours(12));
                return ['text' => $text, 'model' => $model];
            }

            $status = $response->status();
            $message = (string) $response->json('error.message', '');
            Log::warning('Gemini API error', ['model' => $model, 'status' => $status, 'message' => $message]);
            $lastError = ['error' => $message ?: "Gemini HTTP {$status}", 'status' => $status];

            // Model bị ngừng / không hỗ trợ -> thử model kế tiếp. Lỗi khác (key sai, hết quota) -> dừng.
            $modelUnavailable = $status === 404
                || ($status === 400 && preg_match('/not (found|supported)|unknown model|is not available/i', $message));
            if (!$modelUnavailable) {
                break;
            }
            if (Cache::get(self::WORKING_MODEL_CACHE_KEY) === $model) {
                Cache::forget(self::WORKING_MODEL_CACHE_KEY);
            }
        }

        return $lastError;
    }

    /**
     * Ghép các phần text của câu trả lời (bỏ phần "suy nghĩ" của model thinking nếu có).
     */
    protected function extractText(?array $data): ?string
    {
        $parts = $data['candidates'][0]['content']['parts'] ?? [];
        $texts = [];
        foreach ($parts as $part) {
            if (isset($part['text']) && empty($part['thought'])) {
                $texts[] = $part['text'];
            }
        }
        $text = trim(implode('', $texts));

        return $text === '' ? null : $text;
    }

    protected function buildConfig(array $defaults, array $options): array
    {
        $jsonMode = (bool) ($options['json'] ?? false);
        unset($options['json']);

        $config = array_merge($defaults, $options);
        if ($jsonMode) {
            // Buộc Gemini trả về JSON hợp lệ thay vì văn bản kèm markdown
            $config['responseMimeType'] = 'application/json';
        }

        return $config;
    }

    public function generateContent(string $prompt, array $options = []): array
    {
        return $this->generate(
            [['text' => $prompt]],
            $this->buildConfig([
                'temperature' => 0.7,
                'topP' => 0.95,
                'maxOutputTokens' => 4096,
            ], $options),
            30
        );
    }

    public function generateContentWithSystem(string $systemPrompt, string $userPrompt): array
    {
        return $this->generateContent($systemPrompt . "\n\nUser: " . $userPrompt);
    }

    public function generateMultimodalContent(string $prompt, string $base64Image, string $mimeType = 'image/jpeg', array $options = []): array
    {
        return $this->generate(
            [
                ['text' => $prompt],
                ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64Image]],
            ],
            $this->buildConfig([
                'temperature' => 0.4,
                'topP' => 0.95,
                // Model 2.5 có bước "suy nghĩ" tiêu tốn token -> để dư để không bị cắt mất JSON
                'maxOutputTokens' => 6144,
            ], $options),
            45
        );
    }
}
