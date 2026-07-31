// Rate-limit bucket key derivation.
//
// SECURITY: the key must come from a *verified* JWT. Decoding the cookie
// without verifying its signature lets an unauthenticated caller forge a token
// carrying any username and mint a fresh bucket per request, which defeats the
// limiter entirely (notably on the pre-auth login route). Anything we can't
// verify is keyed by client IP instead.
//
// IP keys are normalised to the IPv6 /64 prefix (express-rate-limit does the
// same from v8, which this project doesn't run yet): a single customer is
// routinely handed a whole /64, so keying on the full address would let them
// rotate through billions of addresses for a fresh bucket each.

const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'forgecrm_token';

// IPv4, or IPv4-mapped IPv6 (::ffff:1.2.3.4) -> as-is. IPv6 -> its /64 prefix.
function normaliseIp(ip) {
  if (!ip) return 'unknown';
  const bare = ip.replace(/^::ffff:/i, '').replace(/%.*$/, ''); // strip v4-map + zone id
  if (!bare.includes(':')) return bare;

  const [head, tail = ''] = bare.split('::', 2);
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const groups = bare.includes('::')
    ? [...headGroups, ...Array(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill('0'), ...tailGroups]
    : headGroups;

  return groups.slice(0, 4).map(g => (g || '0').toLowerCase().replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

function rateLimitKey(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload?.id) return `user:${payload.id}`;
    } catch { /* invalid, expired or forged — fall through to IP */ }
  }
  return ipKey(req);
}

// Always-IP key, for pre-authentication routes where there is no session yet.
function ipKey(req) {
  return `ip:${normaliseIp(req.ip)}`;
}

module.exports = { rateLimitKey, ipKey, normaliseIp };
