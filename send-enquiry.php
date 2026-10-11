<?php
// Siyaram Foods — enquiry mailer.
// Works on any PHP hosting (cPanel / shared hosting). Upload next to index.html.
// Sends every enquiry to $TO and replies with JSON for the website form.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$TO   = 'info@siyaramfoods.in';
$FROM = 'noreply@siyaramfoods.in';   // must be an address on your own domain for best delivery

function out($ok, $msg, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $ok, 'message' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'POST required', 405);

// Honeypot: bots fill this hidden field, humans do not.
if (!empty($_POST['_honey'])) out(true, 'OK');

function clean($v, $max = 2000) {
    $v = trim((string)$v);
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}
function header_safe($v) { return trim(preg_replace('/[\r\n]+/', ' ', (string)$v)); }

$name    = clean($_POST['Name'] ?? '', 200);
$company = clean($_POST['Company'] ?? '', 200);
$email   = clean($_POST['Email'] ?? '', 200);
$phone   = clean($_POST['Phone'] ?? '', 60);
$req     = clean($_POST['Requirement'] ?? '', 4000);
$qty     = clean($_POST['Quantity_Packing'] ?? '', 500);

if ($name === '' || $phone === '' || $req === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    out(false, 'Please fill in name, a valid email, phone and requirement.', 422);
}

$subject = 'New Enquiry — Siyaram Foods Website';
$body = "New enquiry received from the Siyaram Foods website\n"
      . "------------------------------------------------\n"
      . "Name: $name\n"
      . "Company: " . ($company ?: 'Not provided') . "\n"
      . "Email: $email\n"
      . "Phone / WhatsApp: $phone\n"
      . "Product / Requirement:\n$req\n\n"
      . "Quantity / Packing: " . ($qty ?: 'Not provided') . "\n"
      . "------------------------------------------------\n"
      . 'Sent: ' . date('d M Y, H:i') . " (server time)\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Siyaram Foods Website <' . header_safe($FROM) . '>',
    'Reply-To: ' . header_safe($name) . ' <' . header_safe($email) . '>',
    'X-Mailer: PHP/' . phpversion(),
];
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = @mail($TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $FROM);
if ($sent) out(true, 'Enquiry sent.');
out(false, 'Mail could not be sent from the server.', 500);
