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

var nock = require('nock'),
    should = require('should');

var KeyManager = require('../lib/certs');

describe('KeyManager', function() {

  afterEach(function() {
    nock.cleanAll();
  });

  it('should fetch certificates', function(done) {
    var google = nock('https://www.googleapis.com')
      .get('/oauth2/v1/certs')
      .reply(200, '{"key1": "foo"}');
    var manager = new KeyManager();
    manager.fetchKey('key1', function(err, key) {
      should.not.exist(err);
      key.should.equal('foo');
      done();
    });
  });

  it('should callback with error', function(done) {
    var google = nock('https://www.googleapis.com')
      .get('/oauth2/v1/certs')
      .reply(500, '');
    var manager = new KeyManager();
    manager.fetchKey('key1', function(err, key) {
      should.exist(err);
      done();
    });
  });

  it('should honor cache control header', function(done) {
    var google = nock('https://www.googleapis.com')
      .get('/oauth2/v1/certs')
      .reply(200, '{"key1": "foo"}', {'cache-control': 'public, max-age=22150, must-revalidate, no-transform'});

    var now = Date.now();
    var manager = new KeyManager();
    manager.fetchKey('key1', function(err, key) {
      should.not.exist(err);
      key.should.equal('foo');

      manager.fetchKey('key2', function(err, key) {
        err.message.should.equal("Key not found");
        done();
      });
    });
  });
});
