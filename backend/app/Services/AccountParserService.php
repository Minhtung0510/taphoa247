<?php

namespace App\Services;

class AccountParserService
{
    /**
     * Phân tích thông tin chi tiết tài khoản từ chuỗi log raw
     */
    public static function parse(?string $raw): array
    {
        $raw = trim((string) $raw);
        $data = [
            'username' => '',
            'password' => '',
            'riot_id' => '',
            'region' => 'AP',
            'rank' => 'Unranked',
            'peak_rank' => 'Unranked',
            'level' => 1,
            'vp' => 0,
            'rp' => 0,
            'kc' => 0,
            'email_verified' => false,
            'phone_verified' => false,
            'last_game' => '',
            'skins_count' => 0,
            'knives' => [],
            'weapons' => [],
            'is_cs' => false,
            'raw' => $raw,
        ];

        if (empty($raw)) {
            return $data;
        }

        // Trường hợp định dạng đơn giản user:pass
        if (!str_contains($raw, "\n") && str_contains($raw, ':')) {
            $parts = explode(':', $raw, 2);
            $data['username'] = trim($parts[0]);
            $data['password'] = trim($parts[1]);
            return $data;
        }

        // 1. Username
        if (preg_match('/Username:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['username'] = trim($m[1]);
        }
        // 2. Password
        if (preg_match('/Password:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['password'] = trim($m[1]);
        }
        // 3. Riot ID
        if (preg_match('/Riot ID:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['riot_id'] = trim($m[1]);
        }
        // 4. Region
        if (preg_match('/Region:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['region'] = trim($m[1]);
        }
        // 5. Rank
        if (preg_match('/(?:Current Rank|Rank):\s*([^\r\n]+)/i', $raw, $m)) {
            $data['rank'] = trim($m[1]);
        }
        // 6. Peak Rank
        if (preg_match('/Peak Rank:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['peak_rank'] = trim($m[1]);
        }
        // 7. Level
        if (preg_match('/Level:\s*(\d+)/i', $raw, $m)) {
            $data['level'] = (int) $m[1];
        }
        // 8. Valorant Points
        if (preg_match('/Valorant Points:\s*(\d+)/i', $raw, $m)) {
            $data['vp'] = (int) $m[1];
        }
        // 9. Radianite Points
        if (preg_match('/Radianite Points:\s*(\d+)/i', $raw, $m)) {
            $data['rp'] = (int) $m[1];
        }
        // 10. Kingdom Credits
        if (preg_match('/Kingdom Credits:\s*(\d+)/i', $raw, $m)) {
            $data['kc'] = (int) $m[1];
        }
        // 11. Email / Phone
        if (preg_match('/Email Verified:\s*(True|Yes|1)/i', $raw)) {
            $data['email_verified'] = true;
        }
        if (preg_match('/Phone Verified:\s*(True|Yes|1)/i', $raw)) {
            $data['phone_verified'] = true;
        }
        // 12. Last Game Date
        if (preg_match('/Last Game Date:\s*([^\r\n]+)/i', $raw, $m)) {
            $data['last_game'] = trim($m[1]);
        }

        // 13. Knives
        if (preg_match('/Knives\s*(?:\((\d+)\))?:[ \t]*([^\r\n]*)/i', $raw, $m)) {
            $knifeCount = isset($m[1]) && $m[1] !== '' ? (int)$m[1] : null;
            $knifeStr = trim($m[2] ?? '');
            if ($knifeCount === 0) {
                $data['knives'] = [];
            } elseif (!empty($knifeStr) && strtolower($knifeStr) !== 'không có' && strtolower($knifeStr) !== 'none') {
                $data['knives'] = array_values(array_filter(array_map('trim', explode(',', $knifeStr))));
            }
        }

        // 14. Weapons / Skins
        $weaponList = [];
        if (preg_match('/Weapons\s*(?:\((\d+)\))?:[ \t]*([^\r\n]*)/i', $raw, $m)) {
            $weaponCount = isset($m[1]) && $m[1] !== '' ? (int)$m[1] : null;
            $weaponsOnSameLine = trim($m[2] ?? '');
            if ($weaponCount === 0) {
                $weaponList = [];
            } elseif (!empty($weaponsOnSameLine)) {
                $weaponList = array_map('trim', explode(',', $weaponsOnSameLine));
            } elseif ($weaponCount !== null && $weaponCount > 0) {
                // Đọc các dòng tiếp theo đến khi gặp Knives hoặc Current Rank
                if (preg_match('/Weapons\s*(?:\(\d+\))?:([\s\S]*?)(?:Knives|Current Rank|Peak Rank|Eligible|$)/i', $raw, $sub)) {
                    $lines = explode("\n", trim($sub[1]));
                    foreach ($lines as $line) {
                        $l = trim($line);
                        if (!empty($l) && !str_starts_with($l, '(') && !str_contains($l, ':')) {
                            $weaponList[] = $l;
                        }
                    }
                }
            }
        }

        // Làm sạch và phân loại loại súng
        $data['weapons'] = array_values(array_filter(array_map(function ($name) {
            $name = trim($name);
            $type = self::detectWeaponType($name);
            return [
                'name' => $name,
                'type' => $type,
                'tier' => self::detectTier($name),
            ];
        }, $weaponList)));

        // Skins count
        if (preg_match('/(?:Total Skins|Skins):\s*(\d+)/i', $raw, $m)) {
            $data['skins_count'] = (int) $m[1];
        } else {
            $data['skins_count'] = count($data['weapons']) + count($data['knives']);
        }

        if (str_contains(strtolower($raw), 'steam') || str_contains(strtolower($raw), 'csgo')) {
            $data['is_cs'] = true;
        }

        return $data;
    }

    /**
     * Nhận diện loại vũ khí từ tên skin
     */
    protected static function detectWeaponType(string $skinName): string
    {
        $types = [
            'Classic', 'Shorty', 'Frenzy', 'Ghost', 'Sheriff',
            'Stinger', 'Spectre', 'Bucky', 'Judge',
            'Bulldog', 'Guardian', 'Phantom', 'Vandal',
            'Marshal', 'Outlaw', 'Operator',
            'Ares', 'Odin',
            'Karambit', 'Dagger', 'Sword', 'Blade', 'Axe', 'Scythe', 'Melee', 'Knife'
        ];

        foreach ($types as $t) {
            if (stripos($skinName, $t) !== false) {
                return $t;
            }
        }
        return 'Vũ Khí';
    }

    /**
     * Nhận diện phân cấp skin (Deluxe, Premium, Ultra, Exclusive)
     */
    protected static function detectTier(string $skinName): string
    {
        $nameLower = strtolower($skinName);
        if (str_contains($nameLower, 'prime') || str_contains($nameLower, 'reaver') || str_contains($nameLower, 'glitchpop') || str_contains($nameLower, 'kuronami') || str_contains($nameLower, 'champions')) {
            return 'Exclusive';
        }
        if (str_contains($nameLower, 'elderflame') || str_contains($nameLower, 'protocol') || str_contains($nameLower, 'singularity')) {
            return 'Ultra';
        }
        if (str_contains($nameLower, 'sovereign') || str_contains($nameLower, 'ion') || str_contains($nameLower, 'magepunk') || str_contains($nameLower, 'oni')) {
            return 'Premium';
        }
        return 'Deluxe';
    }
}
