<?php
// php/login.php  —  Admin authentication
session_start();
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

$username = clean($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    json_response(false, null, 'Username and password are required.');
    exit();
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Regenerate session ID to prevent fixation
        session_regenerate_id(true);

        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id']        = $user['id'];
        $_SESSION['admin_username']  = $user['username'];
        $_SESSION['admin_role']      = $user['role'];

        json_response(true, ['redirect' => 'admin/dashboard.html']);
    } else {
        // Generic message — don't reveal which field was wrong
        json_response(false, null, 'Invalid username or password.');
    }
} catch (\Exception $e) {
    json_response(false, null, 'Login failed. Please try again.');
}
