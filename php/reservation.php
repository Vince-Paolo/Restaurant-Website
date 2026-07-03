<?php
// php/reservation.php  —  Public: submit a reservation (guest or logged-in customer)
session_start();
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    json_response(false, null, 'Method not allowed.');
    exit();
}

// ---- CSRF ------------------------------------------------
$csrf = $_POST['csrf_token'] ?? '';
if (!verify_csrf($csrf, 'reservation')) {
    http_response_code(403);
    json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
    exit();
}

// ---- Collect & sanitize ----------------------------------
$name     = clean($_POST['name']     ?? '');
$email    = clean($_POST['email']    ?? '');
$phone    = clean($_POST['phone']    ?? '');
$date     = clean($_POST['date']     ?? '');
$time     = clean($_POST['time']     ?? '');
$guests   = (int)($_POST['guests']   ?? 0);
$requests = clean($_POST['requests'] ?? '');

// ---- Customer ID (if logged in) --------------------------
$customer_id = !empty($_SESSION['customer_logged_in']) ? (int)$_SESSION['customer_id'] : null;

// ---- Validate --------------------------------------------
$errors = [];
if (!$name)                                              $errors[] = 'Name is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))          $errors[] = 'Valid email is required.';
if (!$date)                                              $errors[] = 'Date is required.';
if (!$time)                                              $errors[] = 'Time is required.';
if ($guests < 1 || $guests > 50)                        $errors[] = 'Party size must be between 1 and 50.';
if ($date && strtotime($date) < strtotime('today'))     $errors[] = 'Reservation date cannot be in the past.';

if ($errors) {
    json_response(false, null, implode(' ', $errors));
    exit();
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO reservations
            (name, email, phone, reservation_date, reservation_time, guests, special_requests, customer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $email, $phone, $date, $time, $guests, $requests, $customer_id]);

    json_response(true, null, 'Your table is booked! We\'ll send a confirmation to ' . $email . ' shortly.');

} catch (\Exception $e) {
    json_response(false, null, 'Could not save your reservation. Please try again.');
}
