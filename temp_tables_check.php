<?php
require __DIR__ . '/php/config.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query('SHOW TABLES');
    $rows = $stmt->fetchAll(PDO::FETCH_NUM);
    echo json_encode(['success' => true, 'tables' => array_map(fn($r)=>$r[0], $rows)], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
