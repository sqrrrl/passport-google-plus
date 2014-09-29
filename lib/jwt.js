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

var util = require('util'),
    crypto = require('crypto');

/**
 * Decodes and parses a segment of the JWT.
 *
 * @param {String} segment Base64 encoded segment
 * @returns {Object} Decoded & parsed data.
 */
var decodeSegment = function(segment) {
  var decoded = new Buffer(segment, 'base64').toString();
  return JSON.parse(decoded);
};

/**
 * Parse an encoded JWT. Does not ensure validaty of the token.
 *
 * @constructor
 * @param {String} jwt Encoded JWT
 */
var Jwt = function(jwt) {
  try {
    var segments = jwt.split('.');
    this.signature = segments.pop();
    this.signatureBase = segments.join('.');
    this.header = decodeSegment(segments.shift());
    this.payload = decodeSegment(segments.shift());
  } catch (e) {
    throw new Error("Unable to parse JWT");
  }
};

/**
 * Validates the signature of the JWT. Currently only validates RSA-SHA256
 * signed JWTs.
 *
 * @param {Object} key PEM encoded public key or certificate
 * @returns {Boolean} True if signature valid
 */
Jwt.prototype.verifySignature = function(key) {
  if (this.header.alg != 'RS256') {
    throw new Error("Only RS256 tokens supported");
  }
  var verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(this.signatureBase);
  return verifier.verify(key, new Buffer(this.signature, 'base64'));
};

/**
 * Validates an access token against the identify token's at_hash.
 *
 * @param {String} accessToken Token to verify
 * @returns {Boolean} True if access token matches
 */
Jwt.prototype.verifyAccessToken = function(accessToken) {
  if (accessToken && this.payload.at_hash) {
    var hash = crypto.createHash('sha256');
    hash.update(accessToken);
    var buffer = new Buffer(hash.digest('hex'), 'hex');
    var signature = buffer.slice(0, 16).toString('base64'); // Only need first 128 bits
    var at_hash = new Buffer(this.payload.at_hash, 'base64').toString('base64'); // Normalize base64 encoding
    return signature == at_hash;
  }
  return false;
};

module.exports = Jwt;
