<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'web2m' => [
        'bank_code' => env('BANK_CODE', 'TPB'),
        'account_no' => env('ACCOUNT_NO', ''),
        'account_name' => env('ACCOUNT_NAME', ''),
        'password' => env('WEB2M_PASSWORD'),
        'token' => env('WEB2M_TOKEN'),
    ],

    'sepay' => [
        'api_key' => env('SEPAY_API_KEY'),
        'bank_code' => env('BANK_CODE', 'TPB'),
        'account_no' => env('ACCOUNT_NO', ''),
        'account_name' => env('ACCOUNT_NAME', ''),
    ],

];
