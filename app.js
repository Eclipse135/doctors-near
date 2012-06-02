
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , csv = require('csv');

var app = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname+'/public/images/favicon.ico'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

postcodes = {};

var getPostcodes = function(){

	fs.readFile('resources/postcodeCoords.json', function (err, data) {
		postcodes = JSON.parse(data);
	});
}

//getPostcodes();


// Routes

app.get('/', routes.home);
app.get('/about', routes.about);
app.get('/api/geolocationToPostcode/:long/:lat', routes.geolocationToPostcode);
app.get('/browse', routes.browse);
app.get('/browse/:location', routes.browse);
app.get('/search', routes.search);
app.get('/:postcode', routes.restResults);

var port = process.env.PORT || 3000;

app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
