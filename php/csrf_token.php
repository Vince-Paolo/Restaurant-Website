<?php
// php/csrf_token.php  —  GET endpoint to fetch a fresh CSRF token for a given context
require 'config.php';
header('Content-Type: application/json');

$context = clean($_GET['context'] ?? 'form');
$allowed = ['register', 'customer_login', 'reservation', 'contact'];
if (!in_array($context, $allowed, true)) {
    http_response_code(400);
    json_response(false, null, 'Unknown context.');
    exit();
}

json_response(true, ['token' => generate_csrf($context)]);
