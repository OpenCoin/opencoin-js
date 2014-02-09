<?php
/*
* Very simple coin exchange server for demo purposes.
*/
 
include_once 'database.class.php';

$Database = new Database();

echo $Database -> get('bla');