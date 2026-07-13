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
            COALESCE(SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END),0)   AS pending,
            COALESCE(SUM(CASE WHEN status='Confirmed' THEN 1 ELSE 0 END),0) AS confirmed,
            COALESCE(SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END),0) AS cancelled
         FROM reservations"
    )->fetch();

    // Order counts + revenue
    $stats['orders'] = $pdo->query(
        "SELECT
            COUNT(*)  AS total,
            COALESCE(SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END),0)   AS pending,
            COALESCE(SUM(CASE WHEN status='Preparing' THEN 1 ELSE 0 END),0) AS preparing,
            COALESCE(SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END),0) AS completed,
            COALESCE(SUM(CASE WHEN status='Completed' THEN total_amount END), 0) AS revenue
         FROM orders"
    )->fetch();

    // Menu counts
    $stats['menu'] = $pdo->query(
        "SELECT COUNT(*) AS total, COALESCE(SUM(is_available),0) AS available FROM menu_items"
    )->fetch();

    // Today's reservations
    $stats['today'] = $pdo->query(
        "SELECT COUNT(*) AS count FROM reservations WHERE reservation_date = CURRENT_DATE"
    )->fetchColumn();

    json_response(true, $stats);

} catch (\Exception $e) {
    json_response(false, null, 'Could not load stats.');
}
