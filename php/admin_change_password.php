<?php
// php/admin_change_password.php  —  Admin: change own password
// Used both for the forced first-login change and voluntary changes later.
require 'config.php';
require_admin();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_response(false, null, 'Method not allowed.');
    exit();
}

// ---- CSRF ------------------------------------------------
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf($csrf, 'admin_action')) {
    http_response_code(403);
    json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
    exit();
}

$current = $_POST['current_password'] ?? '';
$new     = $_POST['new_password']     ?? '';
$confirm = $_POST['confirm_password'] ?? '';

if (!$current || !$new || !$confirm) {
    json_response(false, null, 'All fields are required.');
    exit();
}
if ($new !== $confirm) {
    json_response(false, null, 'New password and confirmation do not match.');
    exit();
}
if (strlen($new) < 8 || !preg_match('/[A-Z]/', $new) || !preg_match('/[0-9]/', $new)) {
    json_response(false, null, 'New password must be at least 8 characters and include an uppercase letter and a number.');
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['admin_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($current, $user['password'])) {
        json_response(false, null, 'Current password is incorrect.');
        exit();
    }
    if (password_verify($new, $user['password'])) {
        json_response(false, null, 'New password must be different from the current password.');
        exit();
    }

    $hash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?')
        ->execute([$hash, $_SESSION['admin_id']]);

    $_SESSION['admin_must_change_password'] = false;

    json_response(true, ['redirect' => 'dashboard.html'], 'Password updated successfully.');
} catch (\Exception $e) {
    json_response(false, null, 'Could not update password. Please try again.');
}
