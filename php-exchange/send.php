<?php
/*
* Very simple coin exchange server for demo purposes.
*/

header('Access-Control-Allow-Origin: *');

include_once 'database.class.php';

$Database = new Database();

// Read POST data
if (isset($_POST['username']) && isset($_POST['message'])) {
	$res = $Database->add($_POST['username'], $_POST['message']);
	if ($res) {
		echo 'OK';
	}
	else {
		echo 'ERROR';
	}
}
else {
	echo 'ERROR';
}