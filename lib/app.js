const mysql = require('mysql');
const ztwapi = require('./ztwapi.js');

//db connection
var tweetsInsert = 'INSERT INTO tweets SET ?'
var usersInsert = 'INSERT INTO users SET ?'
var hashtagsInsert = 'INSERT INTO hashtags SET ?'

var hashtags_rank = 'SELECT label, COUNT(label)AS Frequency FROM hashtags GROUP BY label ORDER BY COUNT(label) DESC LIMIT 10'

var users_rank = 'SELECT user_name, COUNT(user_name)AS Frequency FROM cs527.Tweets GROUP BY user_name ORDER BY COUNT(user_name) DESC LIMIT 10'
var most_followed = 'select * from users ORDER BY followers DESC LIMIT 10;'
var most_friends =  'select * from users ORDER BY friends DESC LIMIT 10;'

var connection = mysql.createConnection({
  host : 'localhost',
  user : 'cs527',
  password : 'megaman4',
  database : 'cs527'
});

connection.connect();

console.log("MySQL connected!");

var sql_err_handler = function( err, res, fields){
  if(err){
    console.log(err.sqlMessage);
    console.log(err.sql);
  }
};

//stream reader, records to DB using above connection
var search = "#news, #portland, #seattle, #Sounders, #Greenleaf, #Worlds2017"
var new_opts = { track: search, stall_warnings: "true" };

//var stream = new ztwapi.StreamHandler( 'https://userstream.twitter.com/1.1/statuses/filter.json', new_opts);

var stream = new ztwapi.StreamHandler(
  'https://userstream.twitter.com/1.1/statuses/sample.json',
  {});

var start_time = 0;
var count = 0;
stream.on('object', function(data) {
  count++;
  if( count % 100 === 0 ){
    var elapsed = Date.now() - start_time;
    console.log(count + " objects seen in " + elapsed + "ms");
    var rate = count / ( elapsed / 1000 );
    console.log(Math.round(rate,2) + " objects per second : " + search);
  }
  if( data.text ) {
    if( data.lang !== 'en' ){
      return;
    }

    //record to db
    var ts = data.timestamp_ms+"";
    ts = ts.substring(0, ts.length-3);
    var post = {
      user_name: data.user.screen_name,
      text: data.text,
      create_time: ts,
      id: data.id
    }

    connection.query(tweetsInsert, post, sql_err_handler);


    for( var i in data.entities.hashtags ){
      var tag = data.entities.hashtags[i];
      console.log(tag);
      //record hashtag and tweet id
      var tag_data = {
        tweet_id: data.id,
        label: tag.text
      }
      connection.query(hashtagsInsert, tag_data, sql_err_handler);

    }

    //record user data to db
    var user_data = {
      screen_name: data.user.screen_name,
      followers: data.user.followers_count,
      friends: data.user.friends_count
    }
    connection.query(usersInsert, user_data, sql_err_handler);

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


const http = require('http');

var httpserv = http.createServer(function(req, res) {

  var joined = 0;

  var res_writer = function(e, r, f) {
    var fields = [];

    for( var i in f){
      fields.push(f[i].name);
      res.write(f[i].name + "\t");
    }
    res.write("\n");

    for( var j in r ){
      var row = r[j];
      for( var i in fields ){
        var k = fields[i];
        var val = row[k];
        res.write(val + "\t");
      }
      res.write('\n');
    }

    res.write('\n');
    console.log(r);
    console.log(f);

    joined++;
    if( joined >= 4 ){
      res.end();
    }
  }

  connection.query(hashtags_rank, res_writer);
  connection.query(most_followed, res_writer);
  connection.query(most_friends, res_writer);
  connection.query(users_rank, res_writer);
});


httpserv.listen(8000);
