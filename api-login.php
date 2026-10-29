<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';
try {
    $config = require __DIR__ . '/config.php';
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4", $config['user'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $statement = $pdo->prepare('SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
        exit;
    }
    session_regenerate_id(true);
    $_SESSION['user'] = ['id' => (int)$user['id'], 'firstName' => $user['first_name'], 'lastName' => $user['last_name'], 'email' => $user['email']];
    echo json_encode(['success' => true, 'message' => 'Welcome back!', 'user' => $_SESSION['user']]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
}
