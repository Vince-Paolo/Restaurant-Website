<?php
// php/login.php  —  Admin authentication
require __DIR__ . '/session_init.php';
require 'config.php';
header('Content-Type: application/json');

// Already logged in?
if (!empty($_SESSION['admin_logged_in'])) {
    json_response(true, null, 'Already logged in.');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_response(false, null, 'Method not allowed.');
    exit();
}

// ---- CSRF ------------------------------------------------
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf($csrf, 'admin_login')) {
    http_response_code(403);
    json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
    exit();
}

// ---- Rate limiting ---------------------------------------
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$username = clean($_POST['username'] ?? '');

if (is_rate_limited('admin:' . strtolower($username), 5, 15) || is_rate_limited('admin:' . $ip, 10, 15)) {
    http_response_code(429);
    json_response(false, null, 'Too many login attempts. Please wait 15 minutes and try again.');
    exit();
}

$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    json_response(false, null, 'Username and password are required.');
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password, role, must_change_password FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Regenerate session ID to prevent fixation
        session_regenerate_id(true);

        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id']        = $user['id'];
        $_SESSION['admin_username']  = $user['username'];
        $_SESSION['admin_role']      = $user['role'];

        $mustChange = !empty($user['must_change_password']);
        $_SESSION['admin_must_change_password'] = $mustChange;

        json_response(true, [
            'redirect'             => $mustChange ? 'admin/change-password.html' : 'admin/dashboard.html',
            'must_change_password' => $mustChange,
        ]);
    } else {
        // Record failed attempt for rate limiting
        record_attempt('admin:' . strtolower($username));
        record_attempt('admin:' . $ip);
        // Generic message — don't reveal which field was wrong
        json_response(false, null, 'Invalid username or password.');
    }
} catch (\Exception $e) {
    json_response(false, null, 'Login failed. Please try again.');
}
