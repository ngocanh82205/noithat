<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    protected string $model = 'gemini-1.5-flash';

    public function __construct()
    {
        $this->apiKey = (string) (config('services.gemini.api_key') ?? env('GEMINI_API_KEY') ?? '');
        $this->model = (string) (env('GEMINI_MODEL', 'gemini-1.5-flash'));
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function generateContent(string $prompt, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API key not configured'];
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'generationConfig' => array_merge([
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 1024,
                    ], $options),
                ]);

            if ($response->failed()) {
                Log::error('Gemini API error', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                return ['error' => 'API request failed: ' . $response->status()];
            }

            $data = $response->json();
            
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return ['text' => $data['candidates'][0]['content']['parts'][0]['text']];
            }

            return ['error' => 'Unexpected response format'];
        } catch (\Exception $e) {
            Log::error('Gemini Service Exception', ['message' => $e->getMessage()]);
            return ['error' => 'Service error: ' . $e->getMessage()];
        }
    }

    public function generateContentWithSystem(string $systemPrompt, string $userPrompt): array
    {
        $fullPrompt = $systemPrompt . "\n\nUser: " . $userPrompt;
        return $this->generateContent($fullPrompt);
    }

    public function generateMultimodalContent(string $prompt, string $base64Image, string $mimeType = 'image/jpeg', array $options = []): array
    {
        if (!$this->isConfigured()) {
            return ['error' => 'Gemini API key not configured'];
        }

        try {
            $response = Http::timeout(35)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/{$this->model}:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => $base64Image,
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => array_merge([
                        'temperature' => 0.4,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 1500,
                    ], $options),
                ]);

            if ($response->failed()) {
                Log::error('Gemini Multimodal API error', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                return ['error' => 'API request failed: ' . $response->status()];
            }

            $data = $response->json();

            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return ['text' => $data['candidates'][0]['content']['parts'][0]['text']];
            }

            return ['error' => 'Unexpected response format'];
        } catch (\Exception $e) {
            Log::error('Gemini Multimodal Exception', ['message' => $e->getMessage()]);
            return ['error' => 'Service error: ' . $e->getMessage()];
        }
    }
}