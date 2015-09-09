<?php
$db = new SQLite3('credit.db');
$currency = 'https://w3id.org/cc#bit';

$URI = $_REQUEST['uri'];

$header = 'Recent';
if ($URI) {
  $results = $db->query("SELECT * FROM ledger where source like '$URI'");
}


header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

if ($row = $results->fetchArray()) {
  $j = new stdClass();
  $j->amount = $row['amount'];
  $j->{'@id'} = $URI;
  $j->currency = 'https://w3id.org/cc#bit';
  echo json_encode($j);
} else {
  echo json_encode(0);
}
?>
