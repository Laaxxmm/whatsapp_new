'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256';
const { rateLimitKey, ipKey, normaliseIp } = require('../src/util/rateLimitKey');

function mockReq({ token, ip = '203.0.113.9' } = {}) {
  return { cookies: token ? { forgecrm_token: token } : {}, ip };
}

test('a validly signed token keys the bucket by user id', () => {
  const token = jwt.sign({ id: 42, username: 'alice', role: 'admin' }, process.env.JWT_SECRET);
  assert.equal(rateLimitKey(mockReq({ token })), 'user:42');
});

test('a forged token falls back to the IP bucket', () => {
  // The attack this guards against: sign with the wrong key (or none) and put
  // an arbitrary identity in the payload to mint a fresh bucket per request.
  const forged = jwt.sign({ id: 999, username: 'attacker' }, 'not-the-real-secret');
  const key = rateLimitKey(mockReq({ token: forged }));
  assert.ok(key.startsWith('ip:'), `expected an IP bucket, got ${key}`);
  assert.ok(!key.includes('999'), 'forged identity must not influence the key');
});

test('an unsigned (alg=none style) token falls back to the IP bucket', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ id: 7, username: 'attacker' })).toString('base64url');
  const key = rateLimitKey(mockReq({ token: `${header}.${body}.` }));
  assert.ok(key.startsWith('ip:'), `expected an IP bucket, got ${key}`);
});

test('an expired token falls back to the IP bucket', () => {
  const token = jwt.sign({ id: 42 }, process.env.JWT_SECRET, { expiresIn: -60 });
  assert.ok(rateLimitKey(mockReq({ token })).startsWith('ip:'));
});

test('no cookie keys by IP, and distinct IPs get distinct buckets', () => {
  const a = rateLimitKey(mockReq({ ip: '203.0.113.9' }));
  const b = rateLimitKey(mockReq({ ip: '198.51.100.4' }));
  assert.ok(a.startsWith('ip:'));
  assert.notEqual(a, b);
});

test('IPv6 addresses in the same /64 share one bucket', () => {
  const a = ipKey(mockReq({ ip: '2001:db8:1234:5678::1' }));
  const b = ipKey(mockReq({ ip: '2001:db8:1234:5678::dead:beef' }));
  assert.equal(a, b);
});

test('IPv6 addresses in different /64s do not share a bucket', () => {
  assert.notEqual(
    ipKey(mockReq({ ip: '2001:db8:1234:5678::1' })),
    ipKey(mockReq({ ip: '2001:db8:1234:9999::1' }))
  );
});

test('normaliseIp handles IPv4, IPv4-mapped, zone ids and full IPv6', () => {
  assert.equal(normaliseIp('203.0.113.9'), '203.0.113.9');
  assert.equal(normaliseIp('::ffff:203.0.113.9'), '203.0.113.9');
  assert.equal(normaliseIp('fe80::1%eth0'), 'fe80:0:0:0::/64');
  // Uncompressed and compressed forms of the same /64 must collapse together.
  assert.equal(
    normaliseIp('2001:0db8:1234:5678:0000:0000:0000:0001'),
    normaliseIp('2001:db8:1234:5678::1')
  );
});

test('ipKey ignores any cookie — pre-auth routes have no session to trust', () => {
  const token = jwt.sign({ id: 42 }, process.env.JWT_SECRET);
  assert.ok(ipKey(mockReq({ token })).startsWith('ip:'));
});
