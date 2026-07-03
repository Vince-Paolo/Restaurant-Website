<?php
// php/customer_auth_check.php  —  Called by frontend to check customer session
session_start();
require 'config.php';
header('Content-Type: application/json');

if (!empty($_SESSION['customer_logged_in'])) {
    json_response(true, [
        'name'  => $_SESSION['customer_name']  ?? '',
        'email' => $_SESSION['customer_email'] ?? '',
        'id'    => $_SESSION['customer_id']    ?? null,
    ]);
} else {
    http_response_code(401);
    json_response(false, null, 'Not authenticated.');
}
