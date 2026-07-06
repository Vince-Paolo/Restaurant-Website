<?php
// php/customer_register.php  —  Public: create a customer account
require __DIR__ . '/session_init.php';
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_response(false, null, 'Method not allowed.');
    exit();
}

// ---- CSRF ------------------------------------------------
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf($csrf, 'register')) {
    http_response_code(403);
    json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
    exit();
}

// ---- Collect & sanitize ----------------------------------
$full_name = clean($_POST['full_name'] ?? '');
$email     = strtolower(trim($_POST['email'] ?? ''));
$phone     = clean($_POST['phone'] ?? '');
$password  = $_POST['password']  ?? '';
$confirm   = $_POST['confirm']   ?? '';

// ---- Validate --------------------------------------------
$errors = [];
if (strlen($full_name) < 2)                          $errors[] = 'Full name must be at least 2 characters.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))       $errors[] = 'Enter a valid email address.';
if (strlen($password) < 8)                           $errors[] = 'Password must be at least 8 characters.';
if (!preg_match('/[A-Z]/', $password))               $errors[] = 'Password must contain at least one uppercase letter.';
if (!preg_match('/[0-9]/', $password))               $errors[] = 'Password must contain at least one number.';
if ($password !== $confirm)                          $errors[] = 'Passwords do not match.';
if ($phone && !preg_match('/^[\d\s\+\-\(\)]{7,20}$/', $phone)) $errors[] = 'Enter a valid phone number.';

if ($errors) {
    json_response(false, null, implode(' ', $errors));
    exit();
}

try {
    // Check duplicate email
    $stmt = $pdo->prepare('SELECT id FROM customers WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        json_response(false, null, 'An account with that email already exists.');
        exit();
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'INSERT INTO customers (full_name, email, phone, password) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$full_name, $email, $phone ?: null, $hash]);
    $customer_id = $pdo->lastInsertId();

    // Auto-login after registration
    session_regenerate_id(true);
    $_SESSION['customer_logged_in'] = true;
    $_SESSION['customer_id']        = $customer_id;
    $_SESSION['customer_name']      = $full_name;
    $_SESSION['customer_email']     = $email;

    json_response(true, ['redirect' => 'account.html', 'name' => $full_name],
        'Welcome to Ember & Salt, ' . $full_name . '!');

} catch (\Exception $e) {
    json_response(false, null, 'Registration failed. Please try again.');
}
