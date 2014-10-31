/*
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var express = require('express'),
    util = require('util'),
    passport = require('passport'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    googleapis = require('googleapis'),
    GooglePlusStrategy = require('passport-google-plus');

var GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'];
var GOOGLE_API_KEY = process.env['GOOGLE_API_KEY'];

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new GooglePlusStrategy({
    clientId: GOOGLE_CLIENT_ID,
    apiKey: GOOGLE_API_KEY
  },
  function(tokens, profile, done) {
    // To keep the example simple, the user's Google profile is returned to
    // represent the logged-in user.
    return done(null, profile, tokens);
  })
);


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'notasecret' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.render('index.jade', { client_id: GOOGLE_CLIENT_ID });
});

app.get('/protected', ensureAuthenticated, function(req, res) {
  res.render('protected.jade', {user: req.user.email});
});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.
app.all('/auth/google/callback', passport.authenticate('google'), function(req, res) {
  // Return user profile back to client
  res.send(req.user);
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(5000);


// Simple route middleware to ensure user is authenticated, use on any protected
// resource.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}
