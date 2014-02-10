<?php
/*
* Very simple coin exchange server for demo purposes.
*/
 
header('Access-Control-Allow-Origin: *');

include_once 'database.class.php';

$Database = new Database();

// Read POST data
if (isset($_GET['username'])) {
	$res = $Database -> get($_GET['username']);
	if ($res !== false) {
		echo $res;
	}
	else {
		echo 'ERROR';
	}
}
else {
	echo 'ERROR';
}
