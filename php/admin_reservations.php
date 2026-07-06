<?php
// php/admin_reservations.php  —  Admin: view & update reservations
require 'config.php';
require_admin();
header('Content-Type: application/json');

// ---- CSRF (state-changing requests only) --------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    if (!verify_csrf($csrf, 'admin_action')) {
        http_response_code(403);
        json_response(false, null, 'Invalid or expired form token. Please refresh and try again.');
        exit();
    }
}

$action = clean($_POST['action'] ?? $_GET['action'] ?? '');

switch ($action) {

    case 'read':
        $status = clean($_GET['status'] ?? '');
        if ($status && in_array($status, ['Pending','Confirmed','Cancelled'])) {
            $stmt = $pdo->prepare(
                'SELECT * FROM reservations WHERE status = ?
                 ORDER BY reservation_date ASC, reservation_time ASC'
            );
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query(
                'SELECT * FROM reservations
                 ORDER BY reservation_date ASC, reservation_time ASC'
            );
        }
        json_response(true, $stmt->fetchAll());
        break;

    case 'update_status':
        $id     = (int)($_POST['id']     ?? 0);
        $status = clean($_POST['status'] ?? '');
        if (!$id || !in_array($status, ['Pending','Confirmed','Cancelled'])) {
            json_response(false, null, 'Valid ID and status required.');
            exit();
        }
        $stmt = $pdo->prepare('UPDATE reservations SET status = ? WHERE id = ?');
        $ok   = $stmt->execute([$status, $id]);
        $ok
            ? json_response(true, null, "Reservation marked as {$status}.")
            : json_response(false, null, 'Update failed.');
        break;

    case 'delete':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) { json_response(false, null, 'ID required.'); exit(); }
        $stmt = $pdo->prepare('DELETE FROM reservations WHERE id = ?');
        $ok   = $stmt->execute([$id]);
        $ok ? json_response(true, null, 'Deleted.') : json_response(false, null, 'Delete failed.');
        break;

    // Stats used by dashboard
    case 'stats':
        $row = $pdo->query(
            "SELECT
                COUNT(*) AS total,
                SUM(status='Pending')   AS pending,
                SUM(status='Confirmed') AS confirmed,
                SUM(status='Cancelled') AS cancelled
             FROM reservations"
        )->fetch();
        json_response(true, $row);
        break;

    default:
        http_response_code(400);
        json_response(false, null, 'Invalid action.');
}
