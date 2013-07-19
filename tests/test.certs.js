var rewire = require('rewire'),
    should = require('should');

var KeyManager = rewire('../lib/certs');

var setRequestMock = function(handler) {
  KeyManager.__set__('request', {
    get: handler
  });
}

describe('KeyManager', function() {  

  it('should fetch certificates', function() {    
    setRequestMock(function(url, callback) {
      url.should.equal('https://www.googleapis.com/oauth2/v1/certs');
      callback(null, {statusCode: 200, headers: {}}, '{"key1": "foo"}');
    });
  
    var manager = new KeyManager();    
    manager.fetchKey('key1', function(err, key) {
      should.not.exist(err);
      key.should.equal('foo');
    });
  });

  it('should callback with error', function() {    
    setRequestMock(function(url, callback) {
      url.should.equal('https://www.googleapis.com/oauth2/v1/certs');
      callback("Internal Error", {statusCode: 500, headers: {}}, '');
    });
  
    var manager = new KeyManager();    
    manager.fetchKey('key1', function(err, key) {
      should.exist(err);
    });
  });

  it('should honor cache control header', function() {    
    var count = 0;
    setRequestMock(function(url, callback) {
      count++;
      callback(null, {statusCode: 200, headers: {'cache-control': 'public, max-age=22150, must-revalidate, no-transform'}}, '{"key1": "foo"}');
    });
    
    var manager = new KeyManager();    
    manager.fetchKey('key1', function(err, key) {
      should.not.exist(err);
      key.should.equal('foo');
    });

    count.should.equal(1);

    manager.fetchKey('key2', function(err, key) {
      should.exist(err);
    });
    
    count.should.equal(1);
  });
  
});