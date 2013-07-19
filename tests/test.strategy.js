var rewire = require('rewire'),
    should = require('should'),
    timekeeper = require('timekeeper');

var GooglePlusStrategy = rewire('../lib/strategy');

var TEST_JWT = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MDQ2MjE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwpfE';
var TEST_KEY = '-----BEGIN CERTIFICATE-----\nMIICITCCAYqgAwIBAgIIajvKwhmOuSgwDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0xMzA3MTIxODU4MzRaFw0xMzA3MTQwNzU4MzRaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wgZ8wDQYJKoZI\nhvcNAQEBBQADgY0AMIGJAoGBANW8tY4B4MrR+WPH4DAZA9rtAlliJrF9RJvmgIFU\nEYVmn8x7oDXLl77ZWW9saKerzIBBBEKewGfxbVP2tsK1T8s6MxdrxReJJ29Gxy2H\nfwUIg2DIte+qpy97wM4rC2BCtx0UH2KVYlFbTHEQJqgUCGdCvO9k9B2NXFyCBQWx\nKymdAgMBAAGjODA2MAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1Ud\nJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4GBALRJPUEunNAzG7HB\n39vfU5Vg0HgA9Tc/IkIgXbWCEblpisL4SMfwG6Xe39c3HL3d/2x0w1xrKMMfBrsp\nq+Hseae3pbaxDwdTHLdqDwCA0jyNjOvbbisp+IHg9wDdRtnh0UUM0RmqISBeXDzc\ncwlgleBChAQ9b7w6aeNVWRiQn7mP\n-----END CERTIFICATE-----\n';

GooglePlusStrategy.__set__('KeyManager', function() {
  this.fetchKey = function(keyId, callback) {
    callback(null, TEST_KEY);
  }  
});

var MockRequest = function(params) {
  this.params = params;
}
MockRequest.prototype.param = function(key) {
  return this.params[key];
}

describe('GooglePlusStrategy', function() {  

  afterEach(function() {
    timekeeper.reset();
  });
  
  it('should validate ID tokens', function() {
    var strategy = new GooglePlusStrategy({
      clientId: '185261657788.apps.googleusercontent.com'
    }, function(tokens, profile, done) {
      console.log(tokens, profile);
      done(null, profile);
    });    

    var req = new MockRequest({id_token: TEST_JWT});
    
    strategy.success = function(user) {
      should.exist(user);
    }
    strategy.error = function(err) {
      should.not.exist(err);
    }
    
    timekeeper.freeze(new Date(1373665000));
    strategy.authenticate(req);    
  });

});