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

var passport = require('passport'),
    extend = require('xtend'),
    util = require('util'),
    googleapis = require('googleapis'),
    async = require('async'),
    request = require('request'),
    KeyManager = require('./certs'),
    Jwt = require('./jwt'),
    OAuth2Client = googleapis.OAuth2Client;


/**
 * Coerce an object or array to an array.
 *
 * @param {Object} arrayOrItem Anthing
 * @returns {Array} An array
 */
var asArray = function(arrayOrItem) {
  if (Array.isArray(arrayOrItem)) {
    return arrayOrItem;
  }
  return [arrayOrItem];
};

/**
 * Memoize API discovery.
 *
 * @param {String} api Google API to use
 * @param {String} version Version of API to use
 * @param {Function} callback
 */
var withApi = async.memoize(function(api, version, callback) {
  googleapis.discover(api, version).execute(callback);
}, function() {
  return arguments[0] + '.' + arguments[1];
});

/**
 * @callback CompletionCallback
 * @param {String} err Error message if failed
 * @param {Object} user User object
 * @param {Object} info Additional info (typically echo tokens back)
 */

/**
 * @callback GooglePlusStrategyCallback
 * @param {Object} tokens Available tokens. May include access and/or refresh tokens
 * @param {Object} profile User profile
 * @param {CompletionCallback} done Callback to indicate completion of auth
 */

/**
 * Configure the Google+ Sign-In strategy
 *
 * @constructor
 * @param {Object} options configuration
 * @param {String} [options.apiKey] API Key for your project
 * @param {String} [options.clientId] Client ID from the APIs console, must match ID configured in button
 * @param {String} [options.clientSecret] Corresponding client secret. Only needed if requesting offline access
 * @param {String[]} [options.presenters] Array of valid client IDs that are authorized to present ID tokens
 * @param {Boolean} [options.skipProfile] True if user profile isn't needed.
 * @param {String} [options.redirectUri] Redirect URI as configured for the app. Defaults to 'postmessage'
 * @param {Boolean} [options.passReqToCallback] True if request should be propagated to the callback as 1st arg.
 * @param {GooglePlusStrategyCallback} callback Callback function once authorization is completed.
 */
var Strategy = function(options, callback) {
  this.options = extend({ redirectUri: 'postmessage'}, options);
  this.name = 'google';
  this.keyManager = new KeyManager();
  this.callback = callback;
};


/**
* Internal state during various phases of exchanging tokens & fetching profiles.
* Either an authorization code or ID token needs to be set.
*
* @constructor
* @param {Object} options Request-specific options
* @param {String} authorizationCode Authorization code to exchange, if available
* @Param {String} idToken ID token to verify, if available
* @Param {String} accessToken Access token to verify, if available
*/
var Context = function(options, authorizationCode, idToken, accessToken) {
  this.options = options;
  this.authorizationCode = authorizationCode;
  this.profile = {};
  this.credentials = {
    id_token: idToken,
    access_token: accessToken
  };
  this.now = Date.now();
  this.apiKey = options.apiKey;
  this.clientId = options.clientId;
  this.clientSecret = options.clientSecret;
  this.redirectUri = options.redirectUri;
  this.fetchProfile = !options.skipProfile;
  this.authorizedPresenters = options.presenters;
  this.passReqToCallback = options.passReqToCallback;
  if (options.noRedirectUri) {
    this.redirectUri = undefined;
  }

};

/**
 * Passport entrypoint.
 *
 * @param {Object} req Request
 * @param {Object} options Optional options to override any configuration set for the strategy
 */
Strategy.prototype.authenticate = function(req, options) {
  options = extend(this.options, options);
  var self = this;

  var done = function(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  };

  var param = function(name) {
    var params = req.params || {};
    var body = req.body || {};
    var query = req.query || {};
    if (null !== params[name] && params.hasOwnProperty(name)) return params[name];
    if (null !== body[name]) return body[name];
    if (null !== query[name]) return query[name];
    return undefined;
  };

  var context = new Context(options, param('code'), param('id_token'), param('access_token'));
  if (!(context.authorizationCode || context.credentials.id_token || context.credentials.access_token)) {
    return done(new Error("Must have either authorization code, ID token, or access token to authenticate."));
  }

  async.waterfall([
    this.validateAccessToken.bind(this, context),
    this.exchangeAuthorizationCode.bind(this),
    this.validateIdToken.bind(this),
    this.loadProfile.bind(this)
    ], function(err, context) {
      if (err) {
        done(err);
      } else {
        if (context.passReqToCallback) {
          self.callback(req, context.credentials, context.profile, done);
        } else {
          self.callback(context.credentials, context.profile, done);
        }
      }
  });
};


/**
 * Exchange an authorization code for access/id tokens. After exchanging, the tokens
 * are available in context.credentials. If no authorization code is available,
 * immediately calls the callback for further processing.
 *
 * @param {Context} context Request context to update
 * @param {Function} callback Completion handler
 */
Strategy.prototype.exchangeAuthorizationCode = function(context, callback) {
  if (context.authorizationCode) {
    var oauth = new googleapis.auth.OAuth2(context.clientId, context.clientSecret, context.redirectUri);
    oauth.getToken(context.authorizationCode, function(err, tokens) {
      context.credentials = tokens;
      callback(err, context);
    });
  } else {
    callback(null, context);
  }
};

/**
 * Validates the audience for an access token. If no token is available,
 * immediately calls the callback for further processing.
 *
 * @param {Context} context Request context to update
 * @param {Function} callback Completion handler
 */
Strategy.prototype.validateAccessToken = function(context, callback) {
  if (context.credentials.access_token) {
    var oauth2 = googleapis.oauth2('v2');
    oauth2.tokeninfo({access_token: context.credentials.access_token}, function(err, data) {
      if (err) {
        // No-op
      } else if (data.audience != context.clientId) {
        err = new Error("Audience mismatch");
      } else {
        context.profile = extend(context.profile, {
          id: data.user_id,
          openid_id: data.openid_id,
          email: data.email,
          email_verified: data.verified_email
        });
      }
      callback(err, context);
    });
  } else {
    callback(null, context);
  }
};


/**
 * Verify the id token if available & update the profile. If no token is available,
 * immediately calls the callback for further processing.
 *
 * @param {Context} context Request context to update
 * @param {Function} callback Completion handler
 */
Strategy.prototype.validateIdToken = function(context, callback) {
  if (context.credentials.id_token) {
    try {
      var jwt = new Jwt(context.credentials.id_token);
      this.keyManager.fetchKey(jwt.header.kid, function(err, key) {
        var now = context.now / 1000;
        var audiences = asArray(jwt.payload.aud);
        if (err) {
          // No-op
        } else if (!jwt.verifySignature(key)) {
          err = new Error("Invalid signature");
        } else if (jwt.payload.iss != 'accounts.google.com') {
          err = new Error("Invalid issuer");
        } else if (audiences.indexOf(context.clientId) == -1) {
          err = new Error("Invalid audience");
        } else if (context.authorizedPresenters && context.authorizedPresenters.indexOf(jwt.payload.azp) == -1) {
          err = new Error("Invalid presenter");
        } else if (jwt.payload.exp < now) {
          err = new Error("Expired token: " + jwt.payload.exp + " < " + now);
        }
        context.profile = extend(context.profile, {
          id: jwt.payload.sub,
          openid_id: jwt.payload.openid_id,
          email: jwt.payload.email,
          email_verified: jwt.payload.email_verified || false
        });
        jwt.verifyAccessToken(context.credentials.access_token);
        callback(err, context);
      });
    } catch (e) {
      callback(new Error("Invalid JWT"), context);
      return;
    }
  } else {
    callback(null, context);
  }
};

/**
 * Fetch & update the user profile. If an access token is available, it is used to authenticate
 * the request. Otherwise only public profile information will be availble.
 *
 * @param {Context} context Request context to update
 * @param {Function} callback Completion handler
 */
Strategy.prototype.loadProfile = function(context, callback) {
  if (context.fetchProfile) {
    var plus = googleapis.plus('v1');
    var auth = null;
    if (context.credentials.access_token) {
      auth = new googleapis.auth.OAuth2(context.clientId, context.clientSecret);
      auth.credentials = context.credentials;
    } else {
      auth = context.apiKey;
    }
    var request = plus.people.get({ userId: context.profile.id, auth: auth }, function(err, data) {
      if(!err) {
        context.profile = extend(context.profile, data);
      }
      callback(err, context);
    });
  } else {
    callback(null, context);
  }
};

module.exports = Strategy;
