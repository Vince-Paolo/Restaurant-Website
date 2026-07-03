<?php
// php/customer_logout.php
session_start();
require 'config.php';
header('Content-Type: application/json');

// Clear only customer session keys (admin session stays untouched if somehow coexisting)
unset(
    $_SESSION['customer_logged_in'],
    $_SESSION['customer_id'],
    $_SESSION['customer_name'],
    $_SESSION['customer_email']
);

// If no other session data remains, destroy entirely
if (empty($_SESSION)) {
    session_destroy();
}

json_response(true, ['redirect' => 'index.html'], 'Signed out successfully.');
