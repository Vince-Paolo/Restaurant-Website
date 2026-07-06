<?php
// php/customer_account.php  —  Fetch logged-in customer's reservations & orders
require __DIR__ . '/session_init.php';
require 'config.php';
require_customer();
header('Content-Type: application/json');

$cid = (int)$_SESSION['customer_id'];

try {
    // Reservations
    $stmt = $pdo->prepare(
        'SELECT id, reservation_date, reservation_time, guests, status, special_requests, created_at
         FROM reservations WHERE customer_id = ? ORDER BY reservation_date DESC LIMIT 20'
    );
    $stmt->execute([$cid]);
    $reservations = $stmt->fetchAll();

    // Orders
    $stmt = $pdo->prepare(
        'SELECT id, items, total_amount, status, notes, order_date
         FROM orders WHERE customer_id = ? ORDER BY order_date DESC LIMIT 20'
    );
    $stmt->execute([$cid]);
    $orders = $stmt->fetchAll();

    json_response(true, [
        'name'         => $_SESSION['customer_name'],
        'email'        => $_SESSION['customer_email'],
        'reservations' => $reservations,
        'orders'       => $orders,
    ]);
} catch (\Exception $e) {
    json_response(false, null, 'Could not load account data.');
}
