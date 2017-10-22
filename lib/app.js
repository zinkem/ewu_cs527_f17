const mysql = require('mysql');
const ztwapi = require('./ztwapi.js');

//db connection
var tweetsInsert = 'INSERT INTO tweets SET ?'
var usersInsert = 'INSERT INTO users SET ?'
var hashtagsInsert = 'INSERT INTO hashtags SET ?'

var hashtags_rank = 'SELECT label, COUNT(label)AS Frequency FROM hashtags GROUP BY label ORDER BY COUNT(label) DESC LIMIT 10'

var hashtags_rank_since = 'select h.label, count(h.label) as freq from hashtags as h inner join tweets as t on h.tweet_id = t.id where t.create_time > ? group by h.label ORDER BY freq desc LIMIT 10'

var users_rank = 'SELECT user_name, COUNT(user_name)AS Frequency FROM cs527.Tweets GROUP BY user_name ORDER BY COUNT(user_name) DESC LIMIT 10'
var most_followed = 'select * from users ORDER BY followers DESC LIMIT 10;'
var most_friends =  'select * from users ORDER BY friends DESC LIMIT 10;'

var search = 'currently collecting from sample stream'

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

    if( err.sqlMessage.includes('Incorrect string value') )
      return 1;

    //console.log(err.sqlMessage);
    //console.log(err.sql);
    return 1;
  }
  return 0;
};

var start_time = 0;
var count = 0;

var object_fn = function(data) {
  count++;

  if( data.text ) {
    if( data.lang !== 'en' ){
      return;
    }

    //record to db
    var ts = data.timestamp_ms+"";
    ts = ts.substring(0, ts.length-3);
    var post = {
      user_name: data.user.screen_name,
      text: data.text.replace('\\x', ' '),
      create_time: ts,
      id: data.id
    }
    connection.query(tweetsInsert, post, function( err, res, fields ){
      if(sql_err_handler(err, res, fields))
        return;
      for( var i in data.entities.hashtags ){
        var tag = data.entities.hashtags[i];
        //record hashtag and tweet id (tweet must exist to add hashtag)
        var tag_data = {
          tweet_id: data.id,
          label: tag.text
        }
        //console.log(tag.text + " " + data.id);
        connection.query(hashtagsInsert, tag_data, sql_err_handler);
      }
    });

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
}


var refused_fn = function() {
  console.log("Connection refused!");
}

var end_fn = function() {
  console.log("Connection end!");
}

//sample stream reader, use this when DB is empty/fresh to bootstrap
var stream = new ztwapi.StreamHandler(
  'https://userstream.twitter.com/1.1/statuses/sample.json',
  {});

stream.on('object', object_fn);
stream.on('refused', refused_fn);
stream.on('end', end_fn);

start_time = Date.now();
//stream.start();

var refresh_fn = function() {
  stream.end();

  var ts = Math.round((new Date()).getTime() / 1000);
  var ts_2hrs_ago = ts - 7200;
  console.log(ts, ts_2hrs_ago);

  connection.query(hashtags_rank_since+'0', ts_2hrs_ago, function(err, res, fields){
    search = "#news, #portland, #seattle, #spokane"
    for( i in res ){
      row = res[i]
      search += ", #"+row.label
    };
    var new_opts = { track: search, stall_warnings: "true" };
    console.log(search);
    stream = new ztwapi.StreamHandler( 'https://userstream.twitter.com/1.1/statuses/filter.json', new_opts);
    stream.on('object', object_fn);
    stream.on('refused', refused_fn);
    stream.on('end', end_fn);
    stream.start();
  });


};

refresh_fn()

var restart = setInterval(refresh_fn, 1200000);

const httpd = require('./http');

var httpserv = new httpd.Httpd({});

httpserv.on('stats', function(event) {
  var res = event.res;

  var elapsed = Date.now() - start_time;
  res.write(count + " objects seen in " + elapsed + "ms\n");
  var rate = count / ( elapsed / 1000 );
  res.write(Math.round(rate,2) + " objects per second\n\n");

  res.end(search);
});

var sql_response_handler = function(event) {
  return function( err, res, fields ){
    console.log(err);
    var data = {};
    data.table = res;
    data.fields = fields;
    event.res.end(JSON.stringify(data));
  }
};

httpserv.on('example', function(event) {
  connection.query("select * from tweets limit 100",  sql_response_handler(event));
});

httpserv.on('hashtags', function(event) {

  console.log(event.args);
  var action = event.args[0];
  var hashtag = event.args[1];

  if( action === 'top'){
    connection.query(hashtags_rank, sql_response_handler(event));
  } if( action === 'stats'){
    connection.query("SELECT label, COUNT(label)AS Frequency FROM hashtags where label = ?;", hashtag, sql_response_handler(event));
  } if( action === 'tweets'){
    connection.query("select * from hashtags h inner join tweets t on h.tweet_id = t.id AND h.label = ?;", hashtag, sql_response_handler(event));
  } if( action === 'timeseries' ){
    connection.query("select h.label, t.create_time from hashtags h inner join tweets t on h.tweet_id = t.id and h.label= ?;", hashtag, sql_response_handler(event));
  }
});

httpserv.listen(8000);

