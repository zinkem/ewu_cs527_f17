var httpd = exports;

const EventEmitter = require('events');
const Url = require('url');
const Query = require('querystring');

var fs = require('fs');
var http = require('http');

var logger = console;
var customLogger = function(custom) {
    logger = custom;
}
httpd.customLogger = customLogger;


var Httpd = function(opts) {

  //cached file data
  this.file_cache = opts.cache_files || {};
  this.cache_files = opts.cache_files || false; //switch to true to turn on caching

  if( opts.logger ){
    customLogger(opts.logger);
  }


  self = this;
  //http server, arg is entry point
  this.server = http.createServer(function(req, res) {

    var http_method = req.method;
    var http_client_ip = req.headers.host;
    var url = Url.parse(req.url);
    var query = Query.parse(url.query);
    var req_path = url.path.split('?')[0];

    var req_log_msg = http_client_ip + '> '+http_method+' '+url.href;
    logger.log(req_log_msg);

    if (req_path == '/') {
      req_path = '/index.html';
    }

    var path_elements = url.pathname.split("/");
    path_elements.shift();

    var api = path_elements.shift();

    if( api === "api" ){
      var event = path_elements.shift();
      var apiOpts = {
        req: req,
        res: res,
        args: path_elements,
        url: url,
        query: query
      };
      self.emit(event, apiOpts)
    } else {
      if( api === "console" &&
          !req_path.includes("script") &&
          !req_path.includes("style")){
        req_path = "/console/index.html";
      }

      if (req_path.endsWith('/')) {
        req_path += 'index.html';
      }
      self.loadFile(req_path,
                    function(err, data) {
                      if (err) {
                        res.end('404 not found');
                      } else {
                        if( req_path.endsWith(".html")){
                          res.setHeader('content-type', 'text/html');
                        } else if (req_path.endsWith(".css")) {
                          res.setHeader('content-type', 'text/css');
                        } else if (req_path.endsWith(".js")){
                          res.setHeader('content-type', 'text/javascript');
                        }
                        res.end(data);
                      }
                    });
    }

  });
}
httpd.Httpd = Httpd;

Httpd.prototype.__proto__ = EventEmitter.prototype;

/**
 * Loads a file from FS or cache, and calls callback(err, data)
 */
Httpd.prototype.loadFile = function(file, callback) {
  var file_cache = this.file_cache;
  var cache_files = this.cache_files;

  if (file_cache[file] && cache_files) {
    logger.log('Loading '+ file +' from cache.');
    callback(null, file_cache[file]);
    return;
  }

  logger.log(file + " not cached, loading from FS");
  fs.readFile('./www'+file, 'utf8', function (err, data) {
    if (!err) {
      file_cache[file] = data;
      logger.log(file + ' added to cache.');
    } else {
      logger.log('Error loading ' + file);
      logger.log(err);
    }

    callback(err, data);
  });


}

Httpd.prototype.listen = function(port) {
  this.server.listen(port);
}

