<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/paystack-config.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please sign in again.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$secretKey = orbitEnv('PAYSTACK_SECRET_KEY');
if ($secretKey === '' || str_contains($secretKey, 'replace_with')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to the .env file.']);
    exit;
}
if (!str_starts_with($secretKey, 'sk_live_')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Test Paystack keys are disabled. Configure a live Paystack secret key.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$amount = round((float)($input['amount'] ?? 0), 2);
if ($amount < 50) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Minimum deposit is GH₵ 50.00']);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$callbackUrl = $scheme . '://' . $_SERVER['HTTP_HOST'] . '/orbit/dashboard.html';
$email = $_SESSION['user']['email'];
$payload = [
    'email' => $email,
    'amount' => (int)round($amount * 100),
    'currency' => 'GHS',
    'callback_url' => $callbackUrl,
    'metadata' => [
        'user_id' => $_SESSION['user']['id'],
        'deposit_type' => 'wallet',
        'business_momo_number' => '0539860840'
    ]
];

$curl = curl_init('https://api.paystack.co/transaction/initialize');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $secretKey, 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30
]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
if ($response === false) {
    $curlError = curl_error($curl);
    curl_close($curl);
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Could not reach Paystack.', 'error' => $curlError]);
    exit;
}
curl_close($curl);
$data = json_decode($response, true);
if ($status < 200 || $status >= 300 || empty($data['status']) || empty($data['data']['authorization_url'])) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => $data['message'] ?? 'Paystack could not start checkout.']);
    exit;
}
echo json_encode(['success' => true, 'authorization_url' => $data['data']['authorization_url'], 'reference' => $data['data']['reference']]);
