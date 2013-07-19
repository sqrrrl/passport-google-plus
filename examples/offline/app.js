var express = require('express'),
    passport = require('passport'),
    googleapis = require('googleapis'),
    GooglePlusStrategy = require('passport-google-plus');
    
var GOOGLE_CLIENT_ID = '185261657788.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'C_X_yxTG1DcmuL6DS6jDM7Ho';
var GOOGLE_API_KEY = 'AIzaSyBGwmrsuBr2BLq-KeOZRx1qFnvHjq1sy1o';

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new GooglePlusStrategy({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    apiKey: GOOGLE_API_KEY
  },
  function(tokens, profile, done) {
    // To keep the example simple, the user's Google profile is returned to
    // represent the logged-in user.
    return done(null, profile, tokens);
  })
);


var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'notasecret' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
  res.render('index.jade', { client_id: GOOGLE_CLIENT_ID });
});

app.get('/activities', ensureAuthenticated, function(req, res) {
  googleapis.discover('plus', 'v1').execute(function(err, client) {
    client.plus.activities.list({ userId: 'me', collection: 'public' })
    .withAuthClient(req.authClient)
    .execute(function(err, data) {
      res.render('activities.jade', {activities: JSON.stringify(data, true, "\t")});
    });
  });  
});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  
app.all('/auth/google/callback', passport.authenticate('google'), function(req, res) {
  req.session.googleCredentials = req.authInfo;
  // Return user profile back to client
  res.send(req.user);
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(5000);


// Simple route middleware to ensure user is authenticated, use on any protected
// resource. Also restores the user's Google oauth token from the session,
// available as req.authClient
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    req.authClient = new googleapis.OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    req.authClient.credentials = req.session.googleCredentials;
    return next();
  }
  res.redirect('/');
}