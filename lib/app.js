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

//stream reader, records to DB using above connection
var stream = new ztwapi.StreamHandler(
  'https://userstream.twitter.com/1.1/statuses/sample.json',
  {});

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
stream.on('object', object_fn);

stream.on('refused', function() {
  console.log("refused!");
});

stream.on('end', function() {
  console.log("end!");
});

start_time = Date.now();
stream.start();


var restart = setInterval(function() {
  stream.end();

  connection.query(hashtags_rank+'0', function(err, res, fields){
    search = "#news, #portland, #seattle, #spokane"
    for( i in res ){
      row = res[i]
      search += ", #"+row.label
    };
    var new_opts = { track: search, stall_warnings: "true" };

    stream = new ztwapi.StreamHandler( 'https://userstream.twitter.com/1.1/statuses/filter.json', new_opts);
    stream.on('object', object_fn);
    stream.start();
  });


}, 1200000);

const httpd = require('./http');

var httpserv = new httpd.Httpd({});

httpserv.on('foo', function(event) {
  event.res.end('boo');
});

httpserv.listen(8000);


/*
const http = require('http');

var httpserv = http.createServer(function(req, res) {

  var joined = 0;
  var join_expect = 7;
  var stats_out = "";

  var post_join = function(){
    joined++;
    if( joined >= join_expect ){
      res.write(stats_out);
      res.end('\n\ncurrent search\n\n'+search);
    }
  }

  var res_writer = function(e, r, f) {

    var fields = [];

    for( var i in f){
      fields.push(f[i].name);
      res.write(f[i].name + "\t\t");
    }
    res.write("\n");

    for( var j in r ){
      var row = r[j];
      for( var i in fields ){
        var k = fields[i];
        var val = row[k];
        res.write(val + "\t\t");
        if( val.length < 8 ){
          res.write("\t");
        }
      }
      res.write('\n');
    }

    res.write('\n');
    post_join();
  }

  var stats_collector = function( e, r, f ){
    var fields = [];
    for( var i in f){
      fields.push(f[i].name);
      stats_out += f[i].name + "\t\t";
    }
    stats_out += ("\n");

    for( var j in r ){
      var row = r[j];
      for( var i in fields ){
        var k = fields[i];
        var val = row[k];
        stats_out += (val + "\t\t");
        if( val.length < 8 ){
          stats_out += ("\t");
        }
      }
      stats_out += ('\n');
    }

    stats_out += ('\n');
    post_join();
  };

  connection.query(hashtags_rank, res_writer);
  connection.query(most_followed, res_writer);
  connection.query(most_friends, res_writer);
  connection.query(users_rank, res_writer);
  connection.query("select count(*) as num_hashtags from hashtags", stats_collector);
  connection.query("select count(*) as num_tweets from tweets", stats_collector);
  connection.query("select count(*) as num_users from users", stats_collector);

  join_expect =7;

  var elapsed = Date.now() - start_time;
  res.write(count + " objects seen in " + elapsed + "ms\n");
  var rate = count / ( elapsed / 1000 );
  res.write(Math.round(rate,2) + " objects per second\n\n");


});


httpserv.listen(8000);
*/
