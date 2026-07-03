<?php
// php/dashboard_stats.php  —  Aggregates stats for the admin dashboard
require 'config.php';
require_admin();
header('Content-Type: application/json');

try {
    $stats = [];

    // Reservation counts
    $stats['reservations'] = $pdo->query(
        "SELECT
            COUNT(*) AS total,
            COALESCE(SUM(status='Pending'),0)   AS pending,
            COALESCE(SUM(status='Confirmed'),0) AS confirmed,
            COALESCE(SUM(status='Cancelled'),0) AS cancelled
         FROM reservations"
    )->fetch();

    // Order counts + revenue
    $stats['orders'] = $pdo->query(
        "SELECT
            COUNT(*)  AS total,
            COALESCE(SUM(status='Pending'),0)   AS pending,
            COALESCE(SUM(status='Preparing'),0) AS preparing,
            COALESCE(SUM(status='Completed'),0) AS completed,
            COALESCE(SUM(CASE WHEN status='Completed' THEN total_amount END), 0) AS revenue
         FROM orders"
    )->fetch();

    // Menu counts
    $stats['menu'] = $pdo->query(
        "SELECT COUNT(*) AS total, COALESCE(SUM(is_available=1),0) AS available FROM menu_items"
    )->fetch();

    // Today's reservations
    $stats['today'] = $pdo->query(
        "SELECT COUNT(*) AS count FROM reservations WHERE reservation_date = CURDATE()"
    )->fetchColumn();

    json_response(true, $stats);

} catch (\Exception $e) {
    json_response(false, null, 'Could not load stats.');
}
