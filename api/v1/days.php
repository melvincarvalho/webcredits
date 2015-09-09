<?php
/**
 * Get aggregate data
 *
 * Get aggregate web credit data on a per day basis
 *
 * @author     Melvin Carvalho <melvincarvalho@gmail.com>
 * @copyright  2015 Melvin Carvalho
 * @license    MIT
 */


/*
* globals
*/
$dbfile   = 'credit.db';
$currency = 'https://w3id.org/cc#bit';


/*
* request parameters
*
* uri : source or destination
*/
if (isset($_REQUEST['uri'])) {
  $uri = $_REQUEST['uri'];
}

if (isset($_REQUEST['description'])) {
  $description = $_REQUEST['description'];
}

if (isset($_REQUEST['days'])) {
  $days = $_REQUEST['days'];
}


/*
* init
*/
$db = new SQLite3($dbfile);


/*
* query
*/
if ($uri) {
  $query = "select sum(amount) amount, DATE(timestamp) date from credit where destination = '$uri'";
  if (!empty($description)) {
    $query .= " and description = '$description' ";
  }
  if (!empty($days)) {
    $query .= " and timestamp > datetime('now', '-$days days') ";
  }
  $query .= " group by date order by date;";
  $results = $db->query($query);
  error_log($query);
}


/*
* headers
*/
header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');


/*
* output results
*/
$res = [];
while ($row = $results->fetchArray()) {
  array_push($res, [ $row['date'], $row['amount'] ]);
}

echo json_encode($res);

?>
