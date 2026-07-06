<?php
// php/session_init.php  —  Hardened session bootstrap
// Always include/require this INSTEAD OF calling session_start() directly,
// so every session cookie gets consistent, safe attributes.
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') == 443)
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,          // session cookie — expires when browser closes
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,   // only sent over HTTPS when the site is served over HTTPS
        'httponly' => true,       // not readable via document.cookie / JS
        'samesite' => 'Lax',      // blocks cross-site POST/GET submission of the cookie
    ]);

    session_start();
}
