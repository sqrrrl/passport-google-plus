# Passport-Google-Plus

[Passport](http://passportjs.org/) strategies for authenticating with the 
[Google+ Sign-In](https://developers.google.com/+/features/sign-in) button. 

This module lets you authenticate using Google in your Node.js applications.
By plugging into Passport, Google+ Sign-In can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-google-plus

## Usage for [Web Server-Side Flow](https://developers.google.com/+/web/signin/server-side-flow)

### Important note

In the [Google Developers Console](https://console.developers.google.com/) make sure you have enabled the Google Plus API, otherwise your calls will fail (seen in [this issue](https://github.com/jaredhanson/passport-google-oauth/pull/45#issuecomment-52711960)).

#### Configure Strategy

The strategy accepts a callback which is called after the user has been authenticated. The
profile and OAuth credentials can be saved or mapped to a user record.

```js
var GooglePlusStrategy = require('passport-google-plus');

passport.use(new GooglePlusStrategy({
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET'
  },
  function(tokens, profile, done) {
    // Create or update user, call done() when complete...
    done(null, profile, tokens);
  }
));
```
    
#### Configure Google+ Sign-In Button

```html
<!-- Add where you want your sign-in button to render -->
<div id="signinButton">
  <span class="g-signin"
    data-scope="https://www.googleapis.com/auth/plus.login"
    data-clientid="YOUR_CLIENT_ID"
    data-redirecturi="postmessage"
    data-accesstype="offline"
    data-cookiepolicy="single_host_origin"
    data-callback="signInCallback">
  </span>
</div>
<div id="result"></div>
```


#### Handle the callback & forward the authorization code

```js
function signInCallback(authResult) {
  if (authResult.code) {
    $.post('/auth/google/callback', { code: authResult.code})
    .done(function(data) {
      $('#signinButton').hide();
    }); 
  } else if (authResult.error) {
    console.log('There was an error: ' + authResult.error);
  }
};
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'google'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Return user back to client
    res.send(req.user);
});
```

## Usage for [Web Client-Side Flow](https://developers.google.com/+/web/signin/#using_the_client-side_flow)

Client-side flows are also supported for web & mobile using ID tokens. When using ID tokens, profile 
data is limited to public information.

#### Configure Strategy

The strategy accepts a callback which is called after the user has been authenticated. The
profile and OAuth credentials can be saved or mapped to a user record.

```js
var GooglePlusStrategy = require('passport-google-plus');

passport.use(new GooglePlusStrategy({
    clientId: 'YOUR_CLIENT_ID',
    apiKey: 'YOUR_API_KEY'
  },
  function(tokens, profile, done) {
    // Create or update user, call done() when complete...
    done(null, profile, tokens);
  }
));
```

#### Configure Google+ Sign-In Button

```html
<!-- Add where you want your sign-in button to render -->
<div id="signinButton">
  <span class="g-signin"
    data-scope="https://www.googleapis.com/auth/plus.login"
    data-clientid="YOUR_CLIENT_ID"
    data-redirecturi="postmessage"
    data-accesstype="online"
    data-cookiepolicy="single_host_origin"
    data-callback="signInCallback">
  </span>
</div>
<div id="result"></div>
```

#### Handle the callback & forward the identity token

```js
function signInCallback(authResult) {
  if (authResult.code) {
    $.post('/auth/google/callback', { id_token: authResult.id_token})
    .done(function(data) {
      $('#signinButton').hide();
    }); 
  } else if (authResult.error) {
    console.log('There was an error: ' + authResult.error);
  }
};
```
