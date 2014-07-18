<?php
//#####################################################
// upload.php - upload encrypted chunks into directory
//
// Part of projekt SLUT https://github.com/bedna-KU/Slut
//
// Licence GNU General Public License
// Version 3
// http://www.gnu.org/copyleft/gpl.html
//#####################################################

// KURWA KEĎ JE CHUNK LEN JEDEN ČAS SA DO NŹAVU MUSÍ DOPLNI5 HNEĎ

$file_name    = $_SERVER['HTTP_X_FILE_NAME']; // File name
if (isset ($_SERVER['HTTP_X_PSEUDO_NAME'])) {
  $cur_name   = $_SERVER['HTTP_X_PSEUDO_NAME']; // File name as file:number:chunks_total:file_size:unixtime
}
$file_size     = $_SERVER['HTTP_X_FILE_SIZE']; // Size in bytes
$index        = $_SERVER['HTTP_X_INDEX']; // Index of chunk
$chunks_total = $_SERVER['HTTP_X_CHUNKS_TOTAL']; // Total of chunks

// If directory don't exist create him
if (!is_dir(upload)) {
  mkdir("upload");
  chmod("upload", 0777);
}

// file_put_contents ("log" . $index, $cur_name);

//#####################################################
// Make directory for file
// Than is number as pseudo name
// Real file name is encrypt in this directery stored
// in file ".name"
//#####################################################
// File name as file:number:chunks_total:file_size
// Time is set in last chunk
function get_name () {
  global $chunks_total, $file_size;
  $currently_name = 1;
  while (file_exists ("../uploads/file:" . $currently_name . ":" . $chunks_total . ":" . $file_size)) {
    $currently_name++;
  }
  return $currently_name;
}

$file_name = rawurldecode ($file_name);

// Name must be set
if (!isset ($file_name)) {
  echo 'ERROR: Name required';
}

// Index must be set
if (!isset ($index)) {
  echo 'ERROR: Index required';
}

// Index must be number
if (!preg_match ('/^[0-9]+$/', $index)) {
  echo 'ERROR: Index must be number';
}

// Chunks_total must be set
if (!isset ($chunks_total)) {
  echo 'ERROR: Index required';
}

// Chunks_total must be number
if (!preg_match ('/^[0-9]+$/', $chunks_total)) {
  echo 'ERROR: Chunks total must be number';
}

// Set path
$path = "../uploads/file:" . $cur_name . ":" . $chunks_total . ":" . $file_size;

// If file exist on server dont upload it
if ($index == "1") {
  $cur_name = get_name(); // Get fist free number as file name
  if (!file_exists ($path)) {
    mkdir ($path);
    chmod ($path, 0777);
    file_put_contents ($path . '/' . 'name', $file_name);
    chmod ($path . "/"."name", 0777);
  }

  $target = $path . "/" . $index;

  // Get sended data
  $input = fopen ("php://input", "r");
  file_put_contents ($target, $input);

  chmod ($path . "/" . $index, 0777);
  // Send
  echo $cur_name;
}
else {
  $target = $path . "/" . $index;

  // Get sended data
  $input = fopen ("php://input", "r");
  file_put_contents ($target, $input);

  chmod ($path . "/" . $index, 0777);
  if ($index == $chunks_total) {
    $file_time = time();
    rename ($path, $path . ":" . $file_time);
  }
  echo $cur_name;
}
?>
