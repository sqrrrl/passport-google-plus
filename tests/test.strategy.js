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

var rewire = require('rewire'),
    should = require('should'),
    nock = require('nock'),
    sinon = require('sinon');

var GooglePlusStrategy = rewire('../lib/strategy');

var TEST_JWT = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MDQ2MjE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwpfE';
var CORRUPT_JWT = 'eyJhbGciOiJSUzI1sImtpZCI6IjE2MDQ2MjE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwpfE';
var TEST_KEY = '-----BEGIN CERTIFICATE-----\nMIICITCCAYqgAwIBAgIIajvKwhmOuSgwDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0xMzA3MTIxODU4MzRaFw0xMzA3MTQwNzU4MzRaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wgZ8wDQYJKoZI\nhvcNAQEBBQADgY0AMIGJAoGBANW8tY4B4MrR+WPH4DAZA9rtAlliJrF9RJvmgIFU\nEYVmn8x7oDXLl77ZWW9saKerzIBBBEKewGfxbVP2tsK1T8s6MxdrxReJJ29Gxy2H\nfwUIg2DIte+qpy97wM4rC2BCtx0UH2KVYlFbTHEQJqgUCGdCvO9k9B2NXFyCBQWx\nKymdAgMBAAGjODA2MAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1Ud\nJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4GBALRJPUEunNAzG7HB\n39vfU5Vg0HgA9Tc/IkIgXbWCEblpisL4SMfwG6Xe39c3HL3d/2x0w1xrKMMfBrsp\nq+Hseae3pbaxDwdTHLdqDwCA0jyNjOvbbisp+IHg9wDdRtnh0UUM0RmqISBeXDzc\ncwlgleBChAQ9b7w6aeNVWRiQn7mP\n-----END CERTIFICATE-----\n';

GooglePlusStrategy.__set__('KeyManager', function() {
  this.fetchKey = function(keyId, callback) {
    callback(null, TEST_KEY);
  };
});


var MockRequest = function(params) {
  this.params = params;
};

MockRequest.prototype.param = function(key) {
  return this.params[key];
};

describe('GooglePlusStrategy', function() {

  beforeEach(function() {
    this.clock = sinon.useFakeTimers(1373665000000, "Date");
    this.strategy = new GooglePlusStrategy({
      clientId: '185261657788.apps.googleusercontent.com',
    }, function(tokens, profile, done) {
      done(null, profile);
    });
  });

  afterEach(function() {
    this.clock.restore();
    nock.cleanAll();
  });

  it('should validate ID tokens', function(done) {
    var req = new MockRequest({id_token: TEST_JWT});
    this.strategy.success = function(user) {
      should.exist(user);
      done();
    };
    this.strategy.error = done;
    this.strategy.authenticate(req, {skipProfile: true});
  });

  it('should handle corrupt ID tokens', function(done) {
    var req = new MockRequest({id_token: CORRUPT_JWT});
    this.strategy.success = function(user) {
      done(new Error("Authentication should have failed."));
    };
    this.strategy.error = function(err) {
      should.exist(err);
      done();
    };
    this.strategy.authenticate(req, {skipProfile: true});
  });

  it('should fetch basic profile with access token', function(done) {
    var google = nock('https://www.googleapis.com')
      .post('/oauth2/v2/tokeninfo?access_token=ya.12345')
      .reply(200, JSON.stringify({
        "issued_to": "185261657788.apps.googleusercontent.com",
        "audience": "185261657788.apps.googleusercontent.com",
        "user_id": "103354693083460731603",
        "scope": "https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.moments.write https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.profile.agerange.read https://www.googleapis.com/auth/plus.profile.language.read https://www.googleapis.com/auth/plus.circles.members.read",
        "expires_in": 3588,
        "access_type": "online"
      }))
      .get('/plus/v1/people/103354693083460731603')
      .reply(200, JSON.stringify({
        "name" : {
          "familyName" : "Bazyl",
          "givenName" : "Steven"
        }
      }));

    var req = new MockRequest({access_token: "ya.12345"});
    this.strategy.success = function(user) {
      should.exist(user);
      user.name.givenName.should.equal("Steven");
      done();
    };
    this.strategy.error = done;
    this.strategy.authenticate(req);
  });

  it('should reject access tokens with an invalid audience', function(done) {
    var google = nock('https://www.googleapis.com')
      .post('/oauth2/v2/tokeninfo?access_token=ya.12345')
      .reply(200, JSON.stringify({
        "issued_to": "185261657788.apps.googleusercontent.com",
        "audience": "285261657788.apps.googleusercontent.com",
        "user_id": "103354693083460731603",
        "scope": "https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.moments.write https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.profile.agerange.read https://www.googleapis.com/auth/plus.profile.language.read https://www.googleapis.com/auth/plus.circles.members.read",
        "expires_in": 3588,
        "access_type": "online"
      }));

    var req = new MockRequest({access_token: "ya.12345"});
    this.strategy.success = function(user) {
      done(new Error("Authentication should have failed."));
    };
    this.strategy.error = function(err) {
      should.exist(err);
      done();
    };
    this.strategy.authenticate(req);
  });

  it('should reject id tokens with an invalid audience', function(done) {
    this.strategy = new GooglePlusStrategy({
      clientId: '285261657788.apps.googleusercontent.com',
    }, function(tokens, profile, done) {
      done(null, profile);
    });

    this.strategy.success = function(user) {
      done(new Error("Authentication should have failed."));
    };
    this.strategy.error = function(err) {
      should.exist(err);
      err.message.should.equal("Invalid audience");
      done();
    };

    var req = new MockRequest({id_token: TEST_JWT});
    this.strategy.authenticate(req, {skipProfile: true});

  });

  it('should pass the request to the callback when enabled', function(done) {
    this.strategy = new GooglePlusStrategy({
      clientId: '185261657788.apps.googleusercontent.com',
      passReqToCallback: true
    }, function(req, tokens, profile, done) {
      if(req instanceof MockRequest) {
        done(null, profile);
      } else {
        done = done || profile; // Args shifted
        done(new Error("first arg was not a request"));
      }
    });

    this.strategy.success = function(user) {
      done();
    };
    this.strategy.error = function(err) {
      done(err);
    };

    var req = new MockRequest({id_token: TEST_JWT});
    this.strategy.authenticate(req, {skipProfile: true});

  });
});
