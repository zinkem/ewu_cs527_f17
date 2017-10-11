const mysql = require('mysql');
const ztwapi = require('./ztwapi.js');

//db connection
var tweetsInsert = 'INSERT INTO Tweets SET ?'

var connection = mysql.createConnection({
  host : 'localhost',
  user : 'cs527',
  password : 'megaman4',
  database : 'cs527'
});

connection.connect();

console.log("MySQL connected!");


//stream reader, records to DB using above connection
var search = "#news, #portland, #seattle, #Sounders, #Greenleaf, #Worlds2017"
var new_opts = { track: search, stall_warnings: "true" };

//var stream = new ztwapi.StreamHandler( 'https://userstream.twitter.com/1.1/statuses/filter.json', new_opts);

var stream = new ztwapi.StreamHandler(
  'https://userstream.twitter.com/1.1/statuses/sample.json',
  {});

var start_time = 0;
var history = [];
var count = 0;
stream.on('object', function(data) {
  count++;
  if( count % 100 === 0 ){
    var elapsed = Date.now() - start_time;
    console.log(count + " objects seen in " + elapsed + "ms");
    var rate = count / ( elapsed / 1000 );
    console.log(Math.round(rate,2) + " objects per second : " + search);
    console.log(history.length);
  }
  if( data.text) {
    //console.log(data.text);
    history.push(data);
    var words = data.text.split(' ');
    //console.log(words);
    for( var i in words ){
      this_word = words[i];
      if( this_word.charAt(0) === '#' ){
        console.log(this_word);
      }
    }

    //record to db
    var post = {
      user_name: data.user.screen_name,
      text: data.text,
    }


    connection.query(tweetsInsert, post, function( err, res, fields ){
      if(err) {
        //console.log(err);
        console.log(data.text);
      }
    });

  } else if ( data.delete ){
    //console.log('deletion : ' + data.delete.status.id);
  } else {
    console.log(data);
  }
});

stream.on('refused', function() {
  console.log("refused!");
  connection.end();
});

stream.on('end', function() {
  console.log("end!");
  connection.end();
});

start_time = Date.now();
stream.start();
