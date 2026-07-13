<?php
require __DIR__ . '/php/config.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query('SELECT id, username, password, role FROM users WHERE username = "admin" LIMIT 1');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'users' => $rows], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
