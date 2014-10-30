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
    should = require('should');

var KeyManager = rewire('../lib/certs');

var setRequestMock = function(handler) {
  KeyManager.__set__('request', {
    get: handler
  });
};

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
    
    var now = Date.now();
    var manager = new KeyManager();    
    manager.fetchKey('key1', function(err, key) {
      should.not.exist(err);
      key.should.equal('foo');

      var expectMinExpiry = now + 22150 * 1000;
      manager.expiry.should.be.below(expectMinExpiry + 500);
      manager.expiry.should.not.be.below(expectMinExpiry);
    });

    count.should.equal(1);

    manager.fetchKey('key2', function(err, key) {
      should.exist(err);
    });
    
    count.should.equal(1);
  });
  
});