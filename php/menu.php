<?php
// php/menu.php  —  Public: fetch menu items (optionally filtered by category)
require 'config.php';
header('Content-Type: application/json');

try {
    $category = clean($_GET['category'] ?? '');

    if ($category && $category !== 'all') {
        $stmt = $pdo->prepare(
            'SELECT id, name, description, price, category, image_url
             FROM menu_items
             WHERE is_available = 1 AND category = ?
             ORDER BY category, name'
        );
        $stmt->execute([$category]);
    } else {
        $stmt = $pdo->query(
            'SELECT id, name, description, price, category, image_url
             FROM menu_items
             WHERE is_available = 1
             ORDER BY category, name'
        );
    }

    $items = $stmt->fetchAll();
    json_response(true, $items);

} catch (\Exception $e) {
    json_response(false, null, 'Could not load menu.');
}
