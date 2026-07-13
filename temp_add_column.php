<?php
require __DIR__ . '/php/config.php';
header('Content-Type: application/json');
try {
    $pdo->exec('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0');
    echo json_encode(['success' => true, 'message' => 'Column added.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
