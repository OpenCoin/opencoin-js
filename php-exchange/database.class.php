<?php
/**
* Very simple text based database
*/

class Database {

	private $filename = 'database.txt';
	private $delimiter = ',';

	/**
	* Writes array to new line of textfile
	* @param $key string
	* @param $value string
	* @return boolean
	*/
	public function add($key, $value) {
		// basic checks
		if (empty ($key) || empty ($value)) {
			user_error('Empty key or value.', E_USER_ERROR);
			return false;
		}
		
		// open file
		$file = fopen($this->filename, 'a');
		if (!$file) {
			user_error('File ' . $this->filename . ' not writable.', E_USER_WARNING);
			return false;
		}
		
		// remove delimiters from $key
		$key = str_replace($this->delimiter, '', $key);
		// remove linebreaks from value
		$value = str_replace("\n", '\n', $value);
		
		// write line to file
		$line = $key . $this->delimiter . $value . "\n";
		fwrite($file, $line);
		
		// close file
		fclose($file);
		
		return true;
	}
	
	/**
	* Searches for a key and deletes it afterwards
	* @param $search string (key)
	* @return $value of first found line on success, false on error or nothing found
	*/
	public function get($search) {
		// basic checks
		if (empty ($search)) {
			user_error('Empty search key', E_USER_ERROR);
			return false;
		}
		
		// open file
		$file = fopen($this->filename, 'r');
		if (!$file) {
			user_error('File ' . $this->filename . ' not readable.', E_USER_WARNING);
			return false;
		}
		
		// read data
		$buffer = '';
		$result = false;
		while (($line = fgets($file)) !== false) {
			$delimiter = strpos($line, $this -> delimiter);
			$key = substr($line, 0, $delimiter);
			if ($result === false && $key == $search) {
				$result = str_replace ('\n', "\n", substr($line, ($delimiter + 1)));
			}
			else {
				$buffer .= $line;
			}
		}
		
		// close file
		fclose($file);
		
		// return result and replace file
		if ($result !== false) {
			if ($this->replace($buffer)) {
				return $result;
			}
		}

		return false;
	}
	
	/**
	* Replaces database with new version
	* @param $data string
	* @return boolean
	*/
	private function replace($data) {
		// open file
		$file = fopen($this->filename, 'w');
		if (!$file) {
			user_error('File ' . $this->filename . ' not writable.', E_USER_WARNING);
			return false;
		}
		
		// write data to file
		fwrite($file, $data);
		
		// close file
		fclose($file);
		
		return true;
	}

}
