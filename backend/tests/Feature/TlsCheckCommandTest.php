<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TlsCheckCommandTest extends TestCase
{
    public function test_app_check_tls_command_returns_success_when_endpoint_reachable(): void
    {
        Http::fake([
            'https://discord.com' => Http::response('OK', 200),
        ]);

        $exitCode = Artisan::call('app:check-tls');
        $output = Artisan::output();

        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('OK', $output);
    }

    public function test_app_check_tls_command_returns_failure_when_ssl_fails(): void
    {
        Http::fake([
            'https://discord.com' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 60: SSL certificate: unable to get local issuer certificate');
            },
        ]);

        $exitCode = Artisan::call('app:check-tls');
        $output = Artisan::output();

        $this->assertEquals(1, $exitCode);
        $this->assertStringContainsString('FAIL', $output);
        $this->assertStringContainsString('cURL error 60', $output);
    }
}
