const mysql = require('mysql');
const ztwapi = require('./ztwapi.js');

//db connection
var tweetsInsert = 'INSERT INTO tweets SET ?'
var usersInsert = 'INSERT INTO users SET ?'
var hashtagsInsert = 'INSERT INTO hashtags SET ?'

var hashtags_rank = 'SELECT label, COUNT(label)AS frequency FROM hashtags GROUP BY label ORDER BY COUNT(label) DESC LIMIT 10'

var hashtags_rank_since = 'select h.label, count(h.label) as frequency from hashtags as h inner join tweets as t on h.tweet_id = t.id where t.create_time > ? group by h.label ORDER BY frequency desc LIMIT ?'

var users_rank = 'SELECT user_name, COUNT(user_name)AS frequency FROM cs527.Tweets GROUP BY user_name ORDER BY COUNT(user_name) DESC LIMIT 10'
var most_followed = 'select * from users ORDER BY followers DESC LIMIT 10;'
var most_friends =  'select * from users ORDER BY friends DESC LIMIT 10;'

var search = 'currently collecting from sample stream'

var mysql_connection_count = 0;
var connection = mysql.createPool({
  host : 'localhost',
  user : 'cs527',
  password : 'megaman4',
  database : 'cs527'
});

connection.on('connection', function (connection) {
  mysql_connection_count++;
  console.log('MySQL connection connected!');
});

//connection.connect();
console.log("MySQL connection pool created!");

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


/**
tf-idf module: todo: move to its own file
*/

function TextDocument() {
  this.freq_map = {};
}


TextDocument.prototype.addTokens = function(tokens) {
  var word_freq = {};
  for( var t in tokens ){
    var word = tokens[t];

    if( word_freq[word] ){
      word_freq[word]++;
    } else {
      word_freq[word] = 1;
    }
  }

  for( var i in word_freq) {
    if( this.freq_map[i] ) {
      this.freq_map[i] += word_freq[i];
    } else {
      this.freq_map[i] = word_freq[i];
    }
  }

}

function TextStats() {
  this.current_doc = new TextDocument();
  this.last_doc = this.current_doc;
  this.all_docs = new TextDocument();
  this.num_retweets = 0;
  this.doc_count = 0;
  this.current_doc_count = 0;
}

TextStats.prototype.addTokens = function(tokens) {
  this.current_doc.addTokens(tokens);
}

TextStats.prototype.processText = function(data) {

  var line = data.text
      .replace('.','')
      .replace('"','')
      .replace('\n', '')
      .replace('-', '')
      .toLowerCase();

  var tokens = line.split(' ');
  this.addTokens(tokens);
}

TextStats.prototype.processTags = function(hashtags) {
  var tokens = [];
  for( i in hashtags ) {
    tokens.push(hashtags[i].text.toLowerCase())
  }

  this.addTokens(tokens);
}

TextStats.prototype.processTweet = function(tweet) {
  if( tweet.retweeted_status ){
    //do not process retweets
    this.num_retweets++;
    return;
  }

  this.doc_count++;
  this.current_doc_count++;
  if( this.current_doc_count >= 1000 ){
    this.current_doc_count = 0;
    this.last_doc = this.current_doc;
    this.current_doc = new TextDocument();

    this.all_docs.addTokens(Object.keys(this.last_doc.freq_map));
  }
  
  console.log(tweet.entities.hashtags);

  this.processTags(tweet.entities.hashtags);

}

TextStats.prototype.textReport = function(req, res) {
  res.write('documents: ' + this.doc_count);
  res.end('\nretweets: ' + this.num_retweets);
}

TextStats.prototype.jsonReport = function(req, res) {
  var data = {};
  data.doc = this.all_docs.freq_map;
  data.term = this.last_doc.freq_map;
  data.total_docs = this.doc_count;
  res.end(JSON.stringify(data));
}

/* end tf-idf module
*/

function HashtagGroups() {
  this.channels = {};
}

HashtagGroups.prototype.addUserToHashtags = function(user, hashtags) {
  for( var i in hashtags ){
    var key = hashtags[i];


    var chan = this.channels[key] || {};
    chan[user] = chan[user]++ || 1;
    this.channels[key] = chan;

  }
}

HashtagGroups.prototype.jsonReport = function(req, res) {
  var data = {};
  data.channels = this.channels;
  res.end(JSON.stringify(data));
}

var groups = new HashtagGroups();
var stats = new TextStats();

var start_time = 0;
var count = 0;
var tweets = 0;
var limit_drops = 0;
var avg_insert = 0;
var high_avg_insert = 0;
var tweet_inserts = 0;
var total_mysql_time = 0;
var object_fn = function(data) {
  count++;
  if( data.text ) {
      tweets++;
    if( data.lang !== 'en' ){
      return;
    }

    stats.processTweet(data);
    var h = [];
    for( var i in data.entities.hashtags ){
      h.push(data.entities.hashtags[i].text.toLowerCase()) 
    }
    groups.addUserToHashtags(data.user.screen_name, h);

    //record to db
    var ts = data.timestamp_ms+"";
    ts = ts.substring(0, ts.length-3);
    var post = {
      user_name: data.user.screen_name,
      text: data.text.replace('\\x', ' '),
      create_time: ts,
      id: data.id
    }

  var query_start_time = Date.now();

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
      tweet_inserts++;
      var elapsed = Date.now() - query_start_time;
      total_mysql_time += elapsed;
      avg_insert = total_mysql_time/tweet_inserts;
      //console.log('write took', elapsed, 'time -- avg/high', avg_insert, high_avg_insert);

      if( avg_insert > high_avg_insert ) {
	console.log('',tweet_inserts, 'tweet high write average increased from',
		    high_avg_insert, 'to', avg_insert, elapsed);
	  high_avg_insert = avg_insert;
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
  } else if ( data.limit ){
      limit_drops = Math.max(limit_drops, data.limit.track);
  } else {
    console.log(data);
  }
}


var refused_fn = function() {
  console.log("Connection refused!");
}

var end_fn = function() {
  console.log("Connection end!");
    refresh_fn();
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
  var ts = Math.round((new Date()).getTime() / 1000);
  var ts_2hrs_ago = ts - 7200;
  console.log(ts, ts_2hrs_ago);

  connection.query(hashtags_rank_since, [ts_2hrs_ago, 100], function(err, res, fields){
    search = "#news, #portland, #seattle, #spokane, #nowplaying"
    for( i in res ){
      row = res[i]
      search += ", #"+row.label
    };
    var new_opts = { track: search, stall_warnings: "true" };
    console.log(search);
      limit_drops = 0;
    stream = new ztwapi.StreamHandler( 'https://userstream.twitter.com/1.1/statuses/filter.json', new_opts);
    stream.on('object', object_fn);
    stream.on('refused', refused_fn);
    stream.on('end', end_fn);
    stream.start();
  });


};

refresh_fn()

var restart = setInterval(function() {
    console.log("Interval re-connect");
    stream.end();
}, 1200000);

const httpd = require('./http');

var httpserv = new httpd.Httpd({});

httpserv.on('members', function(event) {
  groups.jsonReport(event.req, event.res);
});

httpserv.on('text', function(event) {

  console.log(event.args[0]);
  if( event.args[0] )
    stats.jsonReport(event.req, event.res);
  else
    stats.textReport(event.req, event.res);

});

httpserv.on('example', function(event) {
  connection.query("select * from tweets limit 100",  sql_response_handler(event));
});

httpserv.on('stats', function(event) {
  var res = event.res;

  var elapsed = Date.now() - start_time;
  res.write(count + " objects seen in " + elapsed + "ms\n");
  res.write(tweets + " tweets seen in " + elapsed + "ms\n");
  res.write(limit_drops + " tweets dropped\n");
  var rate = tweets / ( elapsed / 1000 );
  res.write(Math.round(rate,2) + " tweets per second\n\n");

  res.write('Average DB tweet insert time: '+ avg_insert + ' ('+ high_avg_insert + ')\n');
  res.write(mysql_connection_count + ' connections\n\n');
  res.write(search);
  var re = /\ #/gi;
  var hash_strip = search.replace(/\ #/gi, '').substr(1);
  var timeseries_link = "\n\ntimeseries/?timespan=14400&tags="+hash_strip

  res.end(timeseries_link);
});

var sql_response_handler = function(event, tag) {
  //var query_start_time = Date.now();
  return function( err, res, fields ){
    if(err) console.log(err);
    var data = {};
    data.table = res;
    data.fields = fields;
    var res_body = JSON.stringify(data);
    var length = Buffer.byteLength(res_body, 'utf8')
    event.res.setHeader('content-type','application/json');
    event.res.setHeader('content-length', length);
    event.res.end(res_body);
    //var elapsed = Date.now() - query_start_time;
    //console.log(tag,length,'bytes sent in', elapsed/1000, 'ms');
  }
};

var fetch_timeseries = function(event, hashtag) {
  var utime = Math.round(new Date().getTime()/1000)
  var oldest = utime - event.query.time;
    console.log('sending timeseries query...', hashtag);
  connection.query("select t.create_time from hashtags h inner join tweets t on h.tweet_id = t.id and h.label= ? and t.create_time > ?;", [ hashtag, oldest] , sql_response_handler(event, hashtag));
};

httpserv.on('hashtags', function(event) {

  var action = event.args[0];
  var hashtag = event.args[1];

  if( action === 'top'){
    connection.query(hashtags_rank, sql_response_handler(event));
  } if( action === 'trending') {
    var ts = Math.round((new Date()).getTime() / 1000);
    var ts_2hrs_ago = ts - 7200;
    connection.query(hashtags_rank_since, [ts_2hrs_ago, 50], sql_response_handler(event));
  } if( action === 'stats'){
    connection.query("SELECT label, COUNT(label)AS frequency FROM hashtags where label = ?;", hashtag, sql_response_handler(event));
  } if( action === 'tweets'){
    connection.query("select * from hashtags h inner join tweets t on h.tweet_id = t.id AND h.label = ? limit 100", hashtag, sql_response_handler(event));
  } if( action === 'timeseries' ){
    fetch_timeseries(event, hashtag);
  }
});

httpserv.listen(8000);

console.log("Http server started!");
