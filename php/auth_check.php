<?php
// php/auth_check.php  —  Called by admin pages via fetch to verify session
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!empty($_SESSION['admin_logged_in'])) {
    json_response(true, [
        'username' => $_SESSION['admin_username'] ?? '',
        'role'     => $_SESSION['admin_role'] ?? 'admin',
    ]);
} else {
    http_response_code(401);
    json_response(false, null, 'Not authenticated.');
}
