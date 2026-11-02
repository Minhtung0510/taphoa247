<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Device gateway receives payments; maintenance never calls a bank API.
\Illuminate\Support\Facades\Schedule::command('payments:poll --maintenance-only')->everyMinute()->withoutOverlapping(10);
