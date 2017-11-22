var OAuth = require('oauth').OAuth;
var util  = require('util');
var querystring = require('querystring');
var config = require('./myconfig').config

//oauth credentials should be stored in myconfig.js________________
var access_token = config.access_token;
var access_token_secret = config.access_token_secret;
/*
var oa = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    config.consumer_key,
    config.consumer_secret,
    "1.0A",
    null,
    "HMAC-SHA1"
  );
*/
var twapi = exports;

twapi.oa = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    config.consumer_key,
    config.consumer_secret,
    "1.0A",
    null,
    "HMAC-SHA1"
  );


//utilities________________________________________________________
var packURL = function(base, params){
  var packedurl = base+"?"+querystring.stringify(params);
  return packedurl;
};


//io callback wrappers________________________________________________

//checks for errors before calling cb-- all cbs should be derived from this
var errorCheckingCallback = function(cb){
  return function(error, data){
    if(error){
      console.log("Error: ");
      console.log(error); 
    } else {
      cb(error, data);
    }
  };
};
twapi.errorCheckingCallback = errorCheckingCallback;


//expects dataparser returns an array/object from io data
//performs dataop on each 
var parseIterateCallback = function(dataparser, dataop){
  return errorCheckingCallback(function(error, data) {
    var array = dataparser(data);
    for( var i in array ){
      dataop(array[i]);
    }
  });
};

//tweet parsers_____________________________________________________
twapi.reverseTweetParser = function(data){
  return JSON.parse(data).reverse();
};

twapi.searchReverseTweetParser = function(data){
  return JSON.parse(data).statuses.reverse();
};

//tweet operations_________________________________________________
var displayTweet = function(tweet){
  var tweet_display = tweet.user.screen_name + " tweets " + 
                      tweet.text + "\n" + 
                      "on " + tweet.created_at + ", id: "+ tweet.id +"\n";
  console.log(tweet_display);
};

var colors = {
  Clear       : "\33[0;0m",
  Black       : "\33[0;30m",
  Blue        : "\33[0;34m",
  Green       : "\33[0;32m",
  Cyan        : "\33[0;36m",
  Red         : "\33[0;31m",
  Purple      : "\33[0;35m",
  Brown       : "\33[0;33m",
  Gray        : "\33[0;37m",
  DarkGray    : "\33[1;30m",
  LightBlue   : "\33[1;34m",
  LightGreen  : "\33[1;32m",
  LightCyan   : "\33[1;36m",
  LightRed    : "\33[1;31m",
  LightPurple : "\33[1;35m",
  Yellow      : "\33[1;33m",
  White       : "\33[1;37m"
}

twapi.displayColorTweet = function(tweet){

  var tweet_header = colors.Green +"@"+ tweet.user.screen_name + colors.DarkGray;
  while(tweet_header.length < 35)
    tweet_header = tweet_header+"_";
  tweet_header = tweet_header+colors.Cyan + tweet.created_at + colors.DarkGray;
  while(tweet_header.length < 100)
    tweet_header = tweet_header+"_";
  tweet_header = tweet_header + tweet.id;

  var tweet_display = colors.White  + tweet.text + colors.Clear+"\n"; 
  tweet_display += colors.Yellow + tweet.favorite_count + " favorites " 
  tweet_display += tweet.retweet_count +" retweets\n"+colors.Gray;

  console.log(tweet_header);
  console.log(tweet_display);

};


//twitter api calls________________________________________________

//suitable for any endpoint that returns data that canbe parsed into an array
//dataparser takes responses 'data' as a parameter and returns an array
//dataop is an operation to be performed on all elements of that array in order

//twitter get, obeys rate limits

//twapi.init must be called, populating rate limit info
//no twitter endpoints can be hit until rate_limit_status is consumed
var return_type = ".json";
var limits = { '/application/rate_limit_status':
               { remaining: 180 } };

twapi.init = function(callback) {

  //rate_limit_status rate limit: 180 per 15m window
  twapi.get("/application/rate_limit_status", {}, (err,res) => {
    var data = JSON.parse(res);
    var resources = data.resources;
    for( var key in resources ){
      var cur_set = resources[key];
      for( var endpoint in cur_set ){
        var rl_info = cur_set[endpoint];
        limits[endpoint] = rl_info;
        if( rl_info.limit !== rl_info.remaining ){
          console.log("[twapi] Rate Limit: " + key + " " +
                      endpoint + " " +
                      rl_info.remaining+"/"+rl_info.limit);
        }
      }
    }
    //console.log(limits);
    callback();
  });

}

twapi.print_limits = function() {
  console.log(limits);
}

twapi.get = function(endpoint, opts, cb){
  console.log("[twapi] " + endpoint + " : " + JSON.stringify(limits[endpoint]));

  var err = null;

  if( !limits[endpoint] ){
    //console.log("[twapi] Invalid endpoint: " +endpoint);
    err = { source: "twapi",
            message: "Invalid endpoint: " + endpoint
    }
  } else if( limits[endpoint].remaining <= 0 ){
    var time_h = new Date();
    time_h.setTime((limits[endpoint].reset)* 1000);
    console.log("[twapi] Rate limit reached for " +endpoint);
    console.log("reset at " + time_h.toUTCString());
    err = { source: "twapi",
            message: "Rate Limit Reached for " + endpoint +
            " - reset at " + time_h.toUTCString()
          }
  } else if( limits[endpoint].remaining < 5 ){
    var time_h = new Date();
    time_h.setTime((limits[endpoint].reset)* 1000);
    console.log("[twapi]" + limits[endpoint].remaining + " left for " +endpoint);
    console.log("reset at " + time_h.toUTCString());
  }

  if( endpoint.includes(':slug') ) {
    if ( !opts.slug ){
    err = { source: "twapi",
            message: "no slug specified in opts for " + endpoint }
    }
  }

  if( err ) { cb( err, null ); return; }

  limits[endpoint].remaining--;
  if( endpoint.includes(':slug') ) {
    endpoint = endpoint.replace(':slug', opts.slug)
    delete opts.slug;
  }

  var url = "https://api.twitter.com/1.1"+endpoint+return_type;
  if(opts) {
    url = packURL(url, opts);
  }
  //console.log("[twapi] GET "+url);

  twapi.oa.get(url, access_token, access_token_secret, cb);
};

twapi.post = function(endpoint, opts, callback){
  var post_body = null;
  var content_type = null;
  var url = "https://api.twitter.com/1.1"+endpoint+".json";
  if( opts ) {
    if( opts.body ) {
      post_body = opts.body;
      delete opts.body
      content_type = "application/json";
    }
    console.log(opts.user_id);
    url = packURL(url, opts);

  }
  console.log("[ztwapi] POST "+url);
  twapi.oa.post( url, access_token, access_token_secret,
                 null, null, callback);
}

//suitable for posting a new tweet to your timeline
twapi.postStatus = function(message){
  var url = packURL("https://api.twitter.com/1.1/statuses/update.json",
                    { "status": message });
  console.log(url);

  twapi.oa.post(url,access_token, access_token_secret, null, null,
    errorCheckingCallback(function(err, data){
      console.log("Status sucessfully set to "+message);
      
      //console.log(err);
      //console.log(data);
    }));

};


//get home feed 
twapi.getHomeFeed = function(dataparser, dataop){
  
  var op1 = dataparser || reverseTweetParser;
  var op2 = dataop || displayColorTweet;

  console.log(dataparser)
  console.log(op1)
  console.log(op2)

  twapi.get("statuses/home_timeline.json", 
    null, parseIterateCallback(op1, op2));
};

//get search results
twapi.getSearchResults = function(searchterms, cb){

  console.log("get search results, "+searchterms);
  this.get("search/tweets.json",
    {"q":searchterms},
    errorCheckingCallback(cb));

};


//Handling data from steams
var EventEmitter = require('events').EventEmitter;

function StreamHandler(endpoint, params){
  EventEmitter.call(this);

  this.oa = twapi.oa;

  this.url = endpoint || "https://userstream.twitter.com/1.1/user.json";
  this.opts = params || {};
  this.res = null;
  this.req = null;
};
util.inherits(StreamHandler, EventEmitter)

//Once StreamHandler is started, it will emit an 'object'
//event that should be listened for in the app
StreamHandler.prototype.start = function(){
  //this.url = packURL(this.url, this.opts);

  var self = this;
  var request = this.oa.post(this.url, 
                    access_token, 
                    access_token_secret, 
                    this.opts);
  this.req = request;

  var objectbuffer = '';

  self.outstream = function(data){
      var message = data.toString('UTF8');
      objectbuffer += message;

      var endofobject = objectbuffer.indexOf('\r\n');
      var twitter_data;

      if( endofobject !== -1) {
        if( objectbuffer !== '\r\n'){
          twitter_data = JSON.parse(objectbuffer);
          twitter_data.length = objectbuffer.length;
          //twitter data is object that gets emitted with event
          self.emit('object', twitter_data)
        }
        objectbuffer = '';
      }

  }

  request.on('response', function(response) {
    console.log('http response ' + response.statusCode);
    console.log(response.headers);

    self.res = response;

    if(response.statusCode != 200)
      self.emit('refused', response)
    else
      response.on('data', self.outstream);

    response.on('close', function(){
      console.log("Streaming connection closed")
    });

  });

  request.on('error', function(error){
    console.log('StreamHandler error on request');
    console.log(error);
  });

  request.on('close', function(){
    console.log('StreamHandler request closed');
    this.req = null;
    this.res = null;
    self.emit('end', this.opts);
  });

  request.on('end', function(){
    console.log('end!!')
  });

  request.end();

  console.log('StreamHandler request sent to ' + self.url)

};

StreamHandler.prototype.end = function(){
  
  if( this.req ){
    this.req.connection.destroy();
  } else {
    console.log("This StreamHandler has no active connections");
  }

};

twapi.StreamHandler = StreamHandler;
