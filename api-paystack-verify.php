<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/paystack-config.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please sign in again.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}
$secretKey = orbitEnv('PAYSTACK_SECRET_KEY');
if ($secretKey === '' || str_contains($secretKey, 'replace_with')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Paystack is not configured.']);
    exit;
}
if (!str_starts_with($secretKey, 'sk_live_')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Test Paystack keys are disabled. Configure a live Paystack secret key.']);
    exit;
}
$reference = preg_replace('/[^a-zA-Z0-9_.=-]/', '', $_GET['reference'] ?? '');
if ($reference === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Missing payment reference.']);
    exit;
}

$curl = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $secretKey],
    CURLOPT_TIMEOUT => 30
]);
$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
if ($response === false) {
    curl_close($curl);
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Could not verify payment.']);
    exit;
}
curl_close($curl);
$data = json_decode($response, true);
$transaction = $data['data'] ?? null;
if ($status < 200 || $status >= 300 || empty($data['status']) || !$transaction || ($transaction['status'] ?? '') !== 'success') {
    http_response_code(402);
    echo json_encode(['success' => false, 'message' => 'Payment has not been completed.']);
    exit;
}
$metadataUserId = $transaction['metadata']['user_id'] ?? null;
if ((string)$metadataUserId !== (string)$_SESSION['user']['id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Payment does not belong to this account.']);
    exit;
}
if (strtoupper($transaction['currency'] ?? '') !== 'GHS') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Unexpected payment currency.']);
    exit;
}
$amount = ((int)$transaction['amount']) / 100;
if ($amount < 50) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Minimum deposit is GH₵ 50.00']);
    exit;
}
echo json_encode(['success' => true, 'amount' => $amount, 'reference' => $reference]);
