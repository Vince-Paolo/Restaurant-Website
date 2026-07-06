<?php
// php/admin_menu_crud.php  —  Admin: full CRUD for menu_items
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

    // ---- CREATE ------------------------------------------------
    case 'create':
        $name        = clean($_POST['name']        ?? '');
        $description = clean($_POST['description'] ?? '');
        $price       = (float)($_POST['price']     ?? 0);
        $category    = clean($_POST['category']    ?? '');
        $image_url   = clean($_POST['image_url']   ?? '');
        // Checkbox default-on: absent field means "available" (matches HTML checkbox semantics)
        $available   = isset($_POST['is_available']) ? (int)!!$_POST['is_available'] : 1;

        if (!$name || !$category || $price <= 0) {
            json_response(false, null, 'Name, category and a valid price are required.');
            exit();
        }

        $stmt = $pdo->prepare(
            'INSERT INTO menu_items (name, description, price, category, image_url, is_available)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        try {
            $ok = $stmt->execute([$name, $description, $price, $category, $image_url, $available]);
            json_response(true, ['id' => $pdo->lastInsertId()], 'Item created.');
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                json_response(false, null, "An item named \"$name\" already exists.");
            } else {
                json_response(false, null, 'Failed to create item.');
            }
        }
        break;

    // ---- READ --------------------------------------------------
    case 'read':
        $stmt  = $pdo->query('SELECT * FROM menu_items ORDER BY category, name');
        json_response(true, $stmt->fetchAll());
        break;

    // ---- UPDATE ------------------------------------------------
    case 'update':
        $id          = (int)($_POST['id']          ?? 0);
        $name        = clean($_POST['name']        ?? '');
        $description = clean($_POST['description'] ?? '');
        $price       = (float)($_POST['price']     ?? 0);
        $category    = clean($_POST['category']    ?? '');
        $image_url   = clean($_POST['image_url']   ?? '');
        $available   = isset($_POST['is_available']) ? (int)$_POST['is_available'] : 1;

        if (!$id || !$name || !$category || $price <= 0) {
            json_response(false, null, 'ID, name, category and valid price are required.');
            exit();
        }

        $stmt = $pdo->prepare(
            'UPDATE menu_items
             SET name=?, description=?, price=?, category=?, image_url=?, is_available=?
             WHERE id=?'
        );
        try {
            $stmt->execute([$name, $description, $price, $category, $image_url, $available, $id]);
            json_response(true, null, 'Item updated.');
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                json_response(false, null, "Another item named \"$name\" already exists.");
            } else {
                json_response(false, null, 'Failed to update item.');
            }
        }
        break;

    // ---- TOGGLE AVAILABILITY -----------------------------------
    case 'toggle':
        $id  = (int)($_POST['id'] ?? 0);
        if (!$id) { json_response(false, null, 'ID required.'); exit(); }

        $stmt = $pdo->prepare('SELECT is_available FROM menu_items WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { json_response(false, null, 'Item not found.'); exit(); }

        $newState = $row['is_available'] ? 0 : 1;
        $stmt = $pdo->prepare('UPDATE menu_items SET is_available = ? WHERE id = ?');
        $stmt->execute([$newState, $id]);
        json_response(true, ['is_available' => $newState], $newState ? 'Item is now available.' : 'Item hidden from menu.');
        break;

    // ---- DELETE ------------------------------------------------
    case 'delete':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) { json_response(false, null, 'ID required.'); exit(); }

        $stmt = $pdo->prepare('DELETE FROM menu_items WHERE id = ?');
        $ok   = $stmt->execute([$id]);
        $ok
            ? json_response(true, null, 'Item deleted.')
            : json_response(false, null, 'Failed to delete item.');
        break;

    default:
        http_response_code(400);
        json_response(false, null, 'Invalid action.');
}
