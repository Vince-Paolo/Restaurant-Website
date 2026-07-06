<?php
require __DIR__ . '/php/config.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query('SHOW COLUMNS FROM users');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'columns' => $rows], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
