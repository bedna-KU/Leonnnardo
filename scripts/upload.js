// Global variables
const BYTES_PER_CHUNK = 256 * 1024; // Chunk sizes.
var chunks; // Chunks, value that gets decremented
var chunks_total; // Total chunks
var blob_content = new Blob(); // Chunk content
var start = 0; // Start read blob
var end; // End read blob
var index = 0; // File index
var browser; // Browser name
// var blob = new Blob(); // Blob with file

//####################################################
// Calculates chunks
//####################################################
function sendRequest () {

  blob = document.getElementById ("fileToUpload").files[0];

  chunks = Math.ceil (blob.size / BYTES_PER_CHUNK); // Calculate the number of chunks
  chunks_total = chunks;
  end = BYTES_PER_CHUNK;
  chunk = blob.slice (start, end); // Slice file to small chunk 
  index++; // First index of chunk is 1
  upload_file ();
}

//####################################################
// Upload chunks and adjustes progress bars
//####################################################
function upload_file () {

  var worker_reader = new Worker ('worker_reader.js');
  var worker_uploader = new Worker ('worker_uploader.js');

  worker_reader.onmessage = function (event) {
    var a = ab2s (event.data);
    var b = s2ab (a);
    // console.log (a);
    upload_array = {"size": blob.size, "name": blob.name, "content": b, "index": index};
    document.getElementById ("back_message").innerHTML = "Writing " + blob.name + " " + index;
    if (browser == "firefox") {
      worker_reader.terminate ();
    }
    return worker_uploader.postMessage (upload_array);
  }

  worker_uploader.onmessage = function (event) {
    if (index < chunks_total) {
      start = end;
      end = start + BYTES_PER_CHUNK;
      index++;
      chunk = blob.slice (start, end);
      // Progress bar
      var percentageDiv = document.getElementById ("percent");
      var progressBar = document.getElementById ("progressBar");
      percentageDiv.innerHTML = "0%";
      progressBar.max = chunks_total;
      progressBar.value = index;
      percentageDiv.innerHTML = Math.round (index/chunks_total * 100) + "%";
      //
      document.getElementById ("back_message").innerHTML = "Reading " + blob.name + " " + index;
      if (browser == "firefox") {
        worker_uploader.terminate ();
        return upload_file ();
      }
      else {
        return worker_reader.postMessage (chunk);
      }
    }
    else {
      worker_reader.terminate ();
      worker_uploader.terminate ();
      upload_merge ();
    }
  }
  document.getElementById ("back_message").innerHTML = "Reading " + blob.name + " " + index;
  worker_reader.postMessage (chunk);
}

//#####################################################
// ArrayBuffer to string 
//#####################################################
function ab2s (buf) {
    var view = new Uint8Array (buf);
    return String.fromCharCode.apply (String, view);
}

//#####################################################
// String to ArrayBuffer 
//#####################################################
function s2ab (str) {
  var buf = new ArrayBuffer (str.length); // 2 bytes for each char
  var bufView = new Uint8Array (buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt (i);
  }
  return buf;
}

//#####################################################
// Merge all uploaded chunks and adjustes progress bars
//#####################################################
function sleep (sleepDuration) {
  var now = new Date ().getTime ();
  while (new Date ().getTime () < now + sleepDuration){ /* do nothing */ }
}

//#####################################################
// Merge all uploaded chunks and adjustes progress bars
//#####################################################
function upload_merge () {
  var xhr;
  var fd;
  var percentageDiv = document.getElementById ("percent");
  var progressBar = document.getElementById ("progressBar");

  percentageDiv.innerHTML = "100%";
  progressBar.value = chunks_total;
  document.getElementById ("back_message").innerHTML="Procesing ...";
  xhr = new XMLHttpRequest ();

  fd = new FormData ();
  fd.append ("name", blob.name);
  fd.append ("index", chunks_total);

  xhr.open ("POST", "merge.php", false);
  xhr.send (fd);
  document.getElementById ("back_message").innerHTML=xhr.responseText;
}

//#####################################################
// Start script after click on Send
// Check is file exists
//#####################################################
function upload_start () {
  var xhr_fe;
  var blob = document.getElementById ('fileToUpload').files[0];

  // Detect browser
  var str = "User-agent header: " + navigator.userAgent;
  if (str.match (/firefox/i)) {
    browser = "firefox";
  }
  else if (str.match (/chrome/i)) {
    browser = "chrome";
  }
  xhr_fe = new XMLHttpRequest ();

  xhr_fe.open ("POST", "file_exists.php", false);
  xhr_fe.setRequestHeader ("X-File-Name", blob.name);
  xhr_fe.send ();
  if (xhr_fe.responseText == "Uploading ...") {
    document.getElementById ("back_message").innerHTML=xhr_fe.responseText;
    sendRequest ();
  }
  else {
    document.getElementById ("back_message").innerHTML="File exists";
  }
}