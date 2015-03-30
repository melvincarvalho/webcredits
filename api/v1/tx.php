<?php
$db = new SQLite3('credit.db');
$currency = 'https://w3id.org/cc#mark';

$URI = $_REQUEST['uri'];

$header = 'Recent';
if ($URI) {
  $results = $db->query("SELECT * FROM credit where source like '$URI' or destination like '$URI' order by timestamp desc LIMIT 100");
}

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

$res = [];
while ($row = $results->fetchArray()) {
  array_push($res, $row);
}

echo json_encode($res);
?>

