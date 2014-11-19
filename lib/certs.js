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

var request = require('request');

/**
 * Regexp for extracting expiration time from cache-control header
 * @constant
 */
var MAX_AGE_RE = /.*max-age=(\d+).*/;

/**
 * Small helper for caching Google's certificates.
 *
 * @constructor
 */
var KeyManager = function() {
  this.certificates = {};
  this.expiry = 0;
};

/**
 * @callback CertificateCallback
 * @param {String} err Error message if certificate not available
 * @param {String} cert Matched key/certificate
 */

/**
 * Fetch a key. Since the key may need to be fetched via HTTP a callback
 * is required. Keys are usually cached though.
 *
 * @param {String} keyId ID of the key to use.
 * @param {CertificateCallback} callback Callback for when certificate is ready
 * @param {Object} options Additional options
 */
KeyManager.prototype.fetchKey = function(keyId, callback, options) {
  options = options || {};

  var shouldFetch = Date.now() >= this.expiry;
  var self = this;

  if (this.certificates[keyId]) {
    callback(null, this.certificates[keyId]);
  } else if (!shouldFetch || options.skipFetch) {
    callback(new Error("Key not found"), null);
  } else {
    this.refreshCertificates(function(err, certificates) {
      self.fetchKey(keyId, callback, {skipFetch: true});
    });
  }
};

/**
 * Parses cache-control header to get expiration time of the certificates.
 *
 * @param {String} header Value of the cache-control header
 * @returns {Number} expiration time in millis
 */
KeyManager.prototype.parseCacheControlHeader = function(header) {
  var match = header.match(MAX_AGE_RE);
  if (match) {
    return match[1] * 1000;
  }
  return 0;
};

/**
 * Fetch current certificates from Google.
 *
 * @param {Function} callback Completion handler
 */
KeyManager.prototype.refreshCertificates = function(callback) {
  var self = this;
  request.get('https://www.googleapis.com/oauth2/v1/certs', function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var cacheControl = res.headers['cache-control'] || '';
      var expiry = self.parseCacheControlHeader(cacheControl);
      self.expiry = Date.now() + expiry;
      self.certificates = JSON.parse(body);
      callback(null, self.certificates);
    } else {
      callback(err, self.certificates);
    }
  });
};

module.exports = KeyManager;
