<?php
// php/config.php  —  Database connection + session helpers
// --------------------------------------------------------
// ENV-based config: set these in your server's environment,
// or in a .env loader. Fallback values shown for local dev.
// --------------------------------------------------------
$host    = getenv('DB_HOST')    ?: 'localhost';
$db      = getenv('DB_NAME')    ?: 'restaurant_db';
$user    = getenv('DB_USER')    ?: 'root';
$pass    = getenv('DB_PASS')    ?: '';
$charset = 'utf8mb4';

$dsn     = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit();
}

// ---------------------------------------------------------
// Session guard — admin pages
// ---------------------------------------------------------
function require_admin(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['admin_logged_in'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
        exit();
    }
}

// ---------------------------------------------------------
// Session guard — customer pages (never grants admin access)
// ---------------------------------------------------------
function require_customer(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['customer_logged_in'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Please log in to your account.']);
        exit();
    }
}

// ---------------------------------------------------------
// Safe JSON response helper
// ---------------------------------------------------------
function json_response(bool $success, $data = null, string $message = ''): void {
    header('Content-Type: application/json');
    $out = ['success' => $success];
    if ($message) $out['message'] = $message;
    if ($data !== null) $out['data'] = $data;
    echo json_encode($out);
}

// ---------------------------------------------------------
// Sanitize string input
// ---------------------------------------------------------
function clean(string $val): string {
    return trim(htmlspecialchars($val, ENT_QUOTES, 'UTF-8'));
}

// ---------------------------------------------------------
// CSRF token generation & verification
// ---------------------------------------------------------
function generate_csrf(string $context = 'form'): string {
    global $pdo;
    if (session_status() === PHP_SESSION_NONE) session_start();
    $token = bin2hex(random_bytes(32));
    // Clean up old tokens (>1 hour) for this context
    $pdo->prepare('DELETE FROM csrf_tokens WHERE context = ? AND created_at < NOW() - INTERVAL 1 HOUR')
        ->execute([$context]);
    $pdo->prepare('INSERT INTO csrf_tokens (token, context) VALUES (?, ?)')
        ->execute([$token, $context]);
    return $token;
}

function verify_csrf(string $token, string $context = 'form'): bool {
    global $pdo;
    if (!$token) return false;
    $stmt = $pdo->prepare(
        'SELECT id FROM csrf_tokens WHERE token = ? AND context = ? AND used = 0
         AND created_at > NOW() - INTERVAL 1 HOUR LIMIT 1'
    );
    $stmt->execute([$token, $context]);
    $row = $stmt->fetch();
    if (!$row) return false;
    // Mark token as used (one-time)
    $pdo->prepare('UPDATE csrf_tokens SET used = 1 WHERE id = ?')->execute([$row['id']]);
    return true;
}

// ---------------------------------------------------------
// Rate limiting — max N attempts per identifier per window
// ---------------------------------------------------------
function is_rate_limited(string $identifier, int $max = 5, int $window_minutes = 15): bool {
    global $pdo;
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM login_attempts
         WHERE identifier = ? AND attempted_at > NOW() - INTERVAL ? MINUTE'
    );
    $stmt->execute([$identifier, $window_minutes]);
    return (int)$stmt->fetchColumn() >= $max;
}

function record_attempt(string $identifier): void {
    global $pdo;
    $pdo->prepare('INSERT INTO login_attempts (identifier) VALUES (?)')->execute([$identifier]);
}
