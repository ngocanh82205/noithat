<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GhnVerifyLocation extends Command
{
    protected $signature = 'ghn:verify-location';
    protected $description = 'Tự động tra cứu mã Tỉnh/Quận/Phường thật từ GHN và so sánh với .env hiện tại';

    public function handle(): int
    {
        $token = config('services.ghn.token') ?? env('GHN_TOKEN');
        $baseUrl = config('services.ghn.endpoint') ?? env('GHN_ENDPOINT', 'https://dev-online-gateway.ghn.vn/shiip/public-api');

        $this->info('Dang goi GHN API...');
        $this->line("Endpoint: $baseUrl");
        $this->line('Token: ' . substr($token, 0, 8) . '...' . substr($token, -4));
        $this->newLine();

        // 1. Lấy danh sách tỉnh, tìm Hà Nội
        $provincesRes = Http::withHeaders(['Token' => $token])->timeout(15)->get("$baseUrl/master-data/province");

        if ($provincesRes->failed()) {
            $this->error('Goi API province that bai. HTTP status: ' . $provincesRes->status());
            $this->line('Response: ' . $provincesRes->body());
            return 1;
        }

        $provinceCode = $provincesRes->json('code');
        $provinces = $provincesRes->json('data') ?? [];
        $this->line("API province tra ve code: $provinceCode, tong so tinh: " . count($provinces));

        if ($provinceCode !== 200 || empty($provinces)) {
            $this->error('Token co the sai hoac het han. Response day du:');
            $this->line(json_encode($provincesRes->json(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            return 1;
        }

        $hanoiMatches = collect($provinces)->filter(function ($p) {
            return mb_strpos($p['ProvinceName'] ?? '', 'Hà Nội') !== false;
        })->values();

        if ($hanoiMatches->isEmpty()) {
            $this->error('Khong tim thay "Ha Noi" trong danh sach tinh GHN tra ve. Danh sach thuc te:');
            foreach ($provinces as $p) {
                $this->line(" - ID {$p['ProvinceID']}: {$p['ProvinceName']}");
            }
            return 1;
        }

        $this->info('Tim thay ' . $hanoiMatches->count() . ' ban ghi ten chua "Ha Noi":');
        $hanoi = null;

        foreach ($hanoiMatches as $candidate) {
            $testDistrictsRes = Http::withHeaders(['Token' => $token])->timeout(15)
                ->post("$baseUrl/master-data/district", ['province_id' => $candidate['ProvinceID']]);
            $testDistricts = $testDistrictsRes->json('data') ?? [];
            $count = count($testDistricts);

            $this->line(" - ProvinceID {$candidate['ProvinceID']} ({$candidate['ProvinceName']}): co $count quan/huyen");

            if ($count > 0 && $hanoi === null) {
                $hanoi = $candidate;
            }
        }

        if ($hanoi === null) {
            $this->error('Tat ca cac ban ghi "Ha Noi" o tren deu KHONG co du lieu quan/huyen nao trong moi truong Staging nay.');
            $this->line('=> Day co the la gioi han cua du lieu test GHN Staging (5sao.ghn.dev), khong phai loi trong code.');
            $this->line('=> Neu can du lieu day du nhu that, can dung Token cua tai khoan Production (khachhang.ghn.vn) thay vi Staging.');
            return 1;
        }

        $this->newLine();
        $this->info("=> Dung ProvinceID = {$hanoi['ProvinceID']} ({$hanoi['ProvinceName']}) vi day la ban ghi co du lieu quan/huyen that.");
        $this->newLine();

        // 2. Lấy danh sách quận/huyện của Hà Nội, tìm Từ Liêm
        $districtsRes = Http::withHeaders(['Token' => $token])->timeout(15)
            ->post("$baseUrl/master-data/district", ['province_id' => $hanoi['ProvinceID']]);

        if ($districtsRes->failed()) {
            $this->error('Goi API district that bai. HTTP status: ' . $districtsRes->status());
            $this->line('Response day du: ' . $districtsRes->body());
            return 1;
        }

        $districtCode = $districtsRes->json('code');
        $districts = $districtsRes->json('data') ?? [];
        $this->line("API district tra ve code: $districtCode, tong so quan/huyen: " . count($districts));

        if ($districtCode !== 200) {
            $this->error('GHN tra ve loi cho buoc lay quan/huyen. Response day du:');
            $this->line(json_encode($districtsRes->json(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            return 1;
        }

        if (empty($districts)) {
            $this->error('GHN tra ve code 200 nhung danh sach quan/huyen RONG cho ProvinceID=' . $hanoi['ProvinceID'] . '. Day la du lieu that tu GHN, khong phai loi code.');
            return 1;
        }

        $tuLiem = collect($districts)->first(function ($d) {
            return mb_strpos($d['DistrictName'] ?? '', 'Từ Liêm') !== false;
        });

        if (!$tuLiem) {
            $this->error('Khong tim thay quan/huyen co ten chua "Tu Liem". Danh sach thuc te cua Ha Noi:');
            foreach ($districts as $d) {
                $this->line(" - ID {$d['DistrictID']}: {$d['DistrictName']}");
            }
            return 1;
        }

        $currentEnvDistrict = env('GHN_FROM_DISTRICT_ID');
        $this->info("OK - Tim thay: {$tuLiem['DistrictName']} => DistrictID that = {$tuLiem['DistrictID']}");
        $this->line("Gia tri dang co trong .env (GHN_FROM_DISTRICT_ID) = $currentEnvDistrict");

        if ((string) $tuLiem['DistrictID'] === (string) $currentEnvDistrict) {
            $this->info('=> KHOP. Khong can sua GHN_FROM_DISTRICT_ID.');
        } else {
            $this->error("=> KHONG KHOP! Can sua .env: GHN_FROM_DISTRICT_ID={$tuLiem['DistrictID']}");
        }
        $this->newLine();

        // 3. Lấy danh sách phường/xã của quận vừa tìm được, tìm Phú Diễn
        $wardsRes = Http::withHeaders(['Token' => $token])->timeout(15)
            ->post("$baseUrl/master-data/ward", ['district_id' => $tuLiem['DistrictID']]);

        if ($wardsRes->failed()) {
            $this->error('Goi API ward that bai. HTTP status: ' . $wardsRes->status());
            $this->line('Response day du: ' . $wardsRes->body());
            return 1;
        }

        $wardCode = $wardsRes->json('code');
        $wards = $wardsRes->json('data') ?? [];
        $this->line("API ward tra ve code: $wardCode, tong so phuong/xa: " . count($wards));

        if ($wardCode !== 200) {
            $this->error('GHN tra ve loi cho buoc lay phuong/xa. Response day du:');
            $this->line(json_encode($wardsRes->json(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            return 1;
        }

        if (empty($wards)) {
            $this->error('GHN tra ve code 200 nhung danh sach phuong/xa RONG cho DistrictID=' . $tuLiem['DistrictID'] . '.');
            return 1;
        }

        $phuDien = collect($wards)->first(function ($w) {
            return mb_strpos($w['WardName'] ?? '', 'Phú Diễn') !== false;
        });

        if (!$phuDien) {
            $this->error('Khong tim thay phuong/xa co ten chua "Phu Dien". Danh sach thuc te:');
            foreach ($wards as $w) {
                $this->line(" - Code {$w['WardCode']}: {$w['WardName']}");
            }
            return 1;
        }

        $currentEnvWard = env('GHN_FROM_WARD_CODE');
        $this->info("OK - Tim thay: {$phuDien['WardName']} => WardCode that = {$phuDien['WardCode']}");
        $this->line("Gia tri dang co trong .env (GHN_FROM_WARD_CODE) = $currentEnvWard");

        if ((string) $phuDien['WardCode'] === (string) $currentEnvWard) {
            $this->info('=> KHOP. Khong can sua GHN_FROM_WARD_CODE.');
        } else {
            $this->error("=> KHONG KHOP! Can sua .env: GHN_FROM_WARD_CODE={$phuDien['WardCode']}");
        }

        $this->newLine();
        $this->info('Hoan tat kiem tra.');

        return 0;
    }
}
