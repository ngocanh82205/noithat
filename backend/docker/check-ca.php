<?php
// docker/check-ca.php — Verify Aiven MySQL SSL CA certificate
$caPath = getenv('MYSQL_ATTR_SSL_CA');
if (!$caPath || !file_exists($caPath)) {
    echo "Warning: MYSQL_ATTR_SSL_CA file not found or empty: {$caPath}\n";
    exit(0);
}

$content = file_get_contents($caPath);
if (strpos($content, 'BEGIN CERTIFICATE') === false) {
    echo "Error: CA file does not appear to contain a valid PEM certificate.\n";
    exit(1);
}

echo "Aiven MySQL CA certificate verified successfully.\n";
exit(0);
