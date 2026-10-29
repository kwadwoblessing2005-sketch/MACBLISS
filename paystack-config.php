<?php
function loadOrbitEnv(): array {
    static $loaded;
    if (isset($loaded)) return $loaded;
    $loaded = [];
    $envPath = __DIR__ . DIRECTORY_SEPARATOR . '.env';
    if (is_readable($envPath)) {
        foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (strlen($value) >= 2 && (($value[0] === '"' && $value[strlen($value)-1] === '"') || ($value[0] === "'" && $value[strlen($value)-1] === "'"))) {
                $value = substr($value, 1, -1);
            }
            $loaded[$key] = $value;
            if (!array_key_exists($key, $_ENV)) $_ENV[$key] = $value;
        }
    }
    return $loaded;
}

function orbitEnv(string $key): string {
    $env = loadOrbitEnv();
    $value = getenv($key);
    return trim(is_string($value) && $value !== '' ? $value : ($env[$key] ?? ''));
}
