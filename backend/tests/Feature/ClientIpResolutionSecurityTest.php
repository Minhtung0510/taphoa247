<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class ClientIpResolutionSecurityTest extends TestCase
{
    use RefreshDatabase;
    public function test_spoofed_x_forwarded_for_from_public_client_is_ignored(): void
    {
        // Simulate a request from public IP 198.51.100.25 trying to spoof 1.2.3.4
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.25',
            'HTTP_X_FORWARDED_FOR' => '1.2.3.4',
        ])->getJson('/api/v1/products');

        $response->assertOk();

        // The resolved IP must remain 198.51.100.25, NOT 1.2.3.4
        $request = app(Request::class);
        $this->assertEquals('198.51.100.25', $request->ip());
    }

    public function test_cf_connecting_ip_from_loopback_proxy_is_trusted(): void
    {
        // Simulate local Cloudflare Tunnel on 127.0.0.1 forwarding visitor 203.0.113.88
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_CF_CONNECTING_IP' => '203.0.113.88',
        ])->getJson('/api/v1/products');

        $response->assertOk();

        $request = app(Request::class);
        $this->assertEquals('203.0.113.88', $request->ip());
    }

    public function test_cf_connecting_ip_from_untrusted_public_client_is_ignored(): void
    {
        // Public client 198.51.100.50 trying to send fake CF-Connecting-IP
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.50',
            'HTTP_CF_CONNECTING_IP' => '1.2.3.4',
        ])->getJson('/api/v1/products');

        $response->assertOk();

        $request = app(Request::class);
        $this->assertEquals('198.51.100.50', $request->ip());
    }
}
