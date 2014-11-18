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

var Jwt = require('../lib/jwt'),
    should = require('should');


var TEST_JWT = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MDQ2MjE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwpfE';
var INVALID_JWT = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MDQ2MjE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwFFF';
var CORRUPT_JWT = 'eyJhbGciOiJSUzI1NiIsImtpZCE3NzlmZmQ2MzM2M2I3NzU2NDc3M2FmN2JmODU4NzA2YjgifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXRfaGFzaCI6IlJlTGFaeWJnbk5EZV9yMWVnM2F5R1EiLCJzdWIiOiIxMDMzNTQ2OTMwODM0NjA3MzE2MDMiLCJjX2hhc2giOiJERk11U3QxQkt0TmstX3FHQjBSQ2hBIiwiYXpwIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiZW1haWwiOiJzcXJycmxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOiJ0cnVlIiwiYXVkIjoiMTg1MjYxNjU3Nzg4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiaWF0IjoxMzczNjY0NDAyLCJleHAiOjEzNzM2NjgzMDJ9.zawnYqhAFAQl_Jxlelt1NJEH2EjzJu-aqSe6fi853vh_a_ajD2m0qB4GI2_y7E1NEgd-4g5n3N9-saTsrPw5sjuTJtKB33QwPmxm-88xj8IO5qjSPnHXL11bbllnzYYeqXqoap0TS5zpPLE6LYnOdj7KI5Yfzuyf6YwgF3IwFFF';
var TEST_KEY = '-----BEGIN CERTIFICATE-----\nMIICITCCAYqgAwIBAgIIajvKwhmOuSgwDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0xMzA3MTIxODU4MzRaFw0xMzA3MTQwNzU4MzRaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wgZ8wDQYJKoZI\nhvcNAQEBBQADgY0AMIGJAoGBANW8tY4B4MrR+WPH4DAZA9rtAlliJrF9RJvmgIFU\nEYVmn8x7oDXLl77ZWW9saKerzIBBBEKewGfxbVP2tsK1T8s6MxdrxReJJ29Gxy2H\nfwUIg2DIte+qpy97wM4rC2BCtx0UH2KVYlFbTHEQJqgUCGdCvO9k9B2NXFyCBQWx\nKymdAgMBAAGjODA2MAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1Ud\nJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4GBALRJPUEunNAzG7HB\n39vfU5Vg0HgA9Tc/IkIgXbWCEblpisL4SMfwG6Xe39c3HL3d/2x0w1xrKMMfBrsp\nq+Hseae3pbaxDwdTHLdqDwCA0jyNjOvbbisp+IHg9wDdRtnh0UUM0RmqISBeXDzc\ncwlgleBChAQ9b7w6aeNVWRiQn7mP\n-----END CERTIFICATE-----\n';
var INVALID_KEY = '-----BEGIN CERTIFICATE-----\nMIICITCCAYqgAwIBAgIIFRGJPCKmQX4wDQYJKoZIhvcNAQEFBQAwNjE0MDIGA1UE\nAxMrZmVkZXJhdGVkLXNpZ25vbi5zeXN0ZW0uZ3NlcnZpY2VhY2NvdW50LmNvbTAe\nFw0xMzA3MTExOTEzMzRaFw0xMzA3MTMwODEzMzRaMDYxNDAyBgNVBAMTK2ZlZGVy\nYXRlZC1zaWdub24uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wgZ8wDQYJKoZI\nhvcNAQEBBQADgY0AMIGJAoGBANMMLqs+zDWsfBFkvVbXIZat+/DHQUdMOu/2o3Ds\nK3FI4Wca3qamR4egFGdTbkJeSjcRmNmWh64ifPieJJnPBkmlT4or09o8FXIg5Nps\n8f9H8mHsfRKZceTR6OqWI3KML5vLbIBQUcWrc0jI3piZUJifGTTAENzEJPEiGljp\nu8A1AgMBAAGjODA2MAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1Ud\nJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3DQEBBQUAA4GBAHoSShq3XjJ6llnl\nyLj6MsuFCYDfU4/YVJCI8PV28MZJh4upW58gBmc30vidPwLU8qvT7qBYUb6kNmMO\nnFh0BklfVWn+8PuQYIqaV/yWF/SpvDV4GZTukDHNWOIbAEt8HRebM1p5LmO0lcwy\nP9jjXY2ROaROHTlOSzNfJ6DWC9EW\n-----END CERTIFICATE-----\n';

describe('Jwt', function() {

  it('should correctly decode JWT', function() {
    var token = new Jwt(TEST_JWT);
    token.verifySignature(TEST_KEY).should.equal(true);
    token.payload.iss.should.equal('accounts.google.com');
  });

  it('should reject invalid keys', function() {
    var token = new Jwt(TEST_JWT);
    token.verifySignature(INVALID_KEY).should.equal(false);
  });

  it('should reject invalid signatures', function() {
    var token = new Jwt(INVALID_JWT);
    token.verifySignature(TEST_KEY).should.equal(false);
  });

  it('should throw on corrupt JWTs', function() {
    (function() { new Jwt(CORRUPT_JWT); }).should.throw();
  });

});
