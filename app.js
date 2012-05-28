
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.home);
app.get('/about', routes.about);
app.get('/api/geolocationToPostcode/:long/:lat', routes.geolocationToPostcode);
app.post('/ServiceSearch.aspx', routes.oldSearch);
app.get('/search', routes.search);
app.get('/Results.aspx', routes.results);
app.get('/:postcode', routes.restResults);

app.error(function(err, req, res){
  res.render('500', {
     error: err
  });
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
