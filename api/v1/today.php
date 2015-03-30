<?php
$db = new SQLite3('credit.db');
$currency = 'https://w3id.org/cc#mark';

$URI = $_REQUEST['uri'];

$header = 'Recent';
if ($URI) {
  $results = $db->query("SELECT sum(amount) amount FROM credit where source like '$URI' and julianday(DATE(timestamp)) = julianday(DATE(CURRENT_DATE)) ");
}

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

if ($row = $results->fetchArray()) {
  echo json_encode($row['amount']);
} else {
  echo json_encode(0);
}
?>

