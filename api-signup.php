<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$firstName = trim($input['firstName'] ?? '');
$lastName = trim($input['lastName'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if (!$firstName || !$lastName || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please provide valid account details.']);
    exit;
}

try {
    $config = require __DIR__ . '/config.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4",
        $config['user'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $statement = $pdo->prepare('INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)');
    $statement->execute([$firstName, $lastName, $email, password_hash($password, PASSWORD_DEFAULT)]);
    $userId = (int)$pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['user'] = ['id' => $userId, 'firstName' => $firstName, 'lastName' => $lastName, 'email' => $email];

    echo json_encode(['success' => true, 'message' => "Welcome aboard, {$firstName}! Your account was saved."]);
} catch (PDOException $error) {
    if ((int) $error->getCode() === 23000) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'An account with that email already exists.']);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Check your server configuration.']);
}
