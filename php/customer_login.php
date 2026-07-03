<?php
// php/customer_login.php  —  Customer authentication (never grants admin access)
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!empty($_SESSION['customer_logged_in'])) {
    json_response(true, ['redirect' => 'account.html'], 'Already logged in.');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_response(false, null, 'Method not allowed.');
    exit();
}

// ---- CSRF ------------------------------------------------
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf($csrf, 'customer_login')) {
    http_response_code(403);
    json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
    exit();
}

// ---- Rate limiting ---------------------------------------
$ip    = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$email = strtolower(trim($_POST['email'] ?? ''));

if (is_rate_limited($email, 5, 15) || is_rate_limited($ip, 10, 15)) {
    http_response_code(429);
    json_response(false, null, 'Too many login attempts. Please wait 15 minutes and try again.');
    exit();
}

$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    json_response(false, null, 'Email and password are required.');
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id, full_name, email, password FROM customers WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $customer = $stmt->fetch();

    if ($customer && password_verify($password, $customer['password'])) {
        session_regenerate_id(true);
        $_SESSION['customer_logged_in'] = true;
        $_SESSION['customer_id']        = $customer['id'];
        $_SESSION['customer_name']      = $customer['full_name'];
        $_SESSION['customer_email']     = $customer['email'];

        json_response(true, [
            'redirect' => 'account.html',
            'name'     => $customer['full_name'],
        ]);
    } else {
        // Record failed attempt for rate limiting
        record_attempt($email);
        record_attempt($ip);
        json_response(false, null, 'Invalid email or password.');
    }
} catch (\Exception $e) {
    json_response(false, null, 'Login failed. Please try again.');
}
