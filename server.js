/* eslint-disable @typescript-eslint/no-var-requires */

const jsonServer = require('json-server');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router('db.json');

const API_PREFIX = '/api';

const browserDistDir = path.join(__dirname, 'dist', 'etekezeskoveto_alkalmazas', 'browser');
const hasBuiltFrontend = fs.existsSync(path.join(browserDistDir, 'index.html'));

const middlewares = hasBuiltFrontend ? jsonServer.defaults({ static: browserDistDir }) : jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

function getAuthUser(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  const userId = match?.[1]?.trim();
  if (!userId) {
    return null;
  }

  const user = router.db.get('users').find({ id: String(userId) }).value();
  return user ?? null;
}

function isWriteMethod(method) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function resourceNameFromPath(pathname) {
  // '/forumTopics/123' -> 'forumTopics'
  const trimmed = String(pathname || '').replace(/^\/+/, '');
  return trimmed.split('/')[0] || '';
}

function idFromPath(pathname) {
  const trimmed = String(pathname || '').replace(/^\/+/, '');
  const parts = trimmed.split('/');
  return parts.length >= 2 ? parts[1] : null;
}

function forbidden(res, message) {
  return res.status(403).json({ error: 'FORBIDDEN', message });
}

function unauthorized(res, message) {
  return res.status(401).json({ error: 'UNAUTHORIZED', message });
}

server.use((req, res, next) => {
  if (!req.path.startsWith(API_PREFIX)) {
    return next();
  }
  const authUser = getAuthUser(req);
  req.authUser = authUser;
  next();
});

// Auth endpoints: login - server-side password verification
server.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'Email és jelszó szükséges.' });
  }

  const user = router.db.get('users').find({ email: String(email).trim().toLowerCase() }).value();
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Hibás email vagy jelszó.' });
  }

  const hash = crypto.createHash('sha256').update(String(password), 'utf8').digest('hex');
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Hibás email vagy jelszó.' });
  }

  // Remove sensitive fields before returning
  const safe = { ...user };
  delete safe.passwordHash;
  return res.json(safe);
});

// Simple sanitizer to prevent raw HTML in stored data
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') copy[key] = sanitizeString(val);
    else if (val && typeof val === 'object') copy[key] = sanitizeObject(val);
    else copy[key] = val;
  }
  return copy;
}

server.use((req, res, next) => {
  if (!req.path.startsWith(API_PREFIX)) {
    return next();
  }
  const apiPath = req.path.slice(API_PREFIX.length) || '/';

  const resource = resourceNameFromPath(apiPath);
  const id = idFromPath(apiPath);
  const authUser = req.authUser;
  const isWrite = isWriteMethod(req.method);

  // Allow public reads for most resources.
  if (!isWrite) {
    // Protect reading other users' profiles.
    if (resource === 'users' && id) {
      if (!authUser) {
        return unauthorized(res, 'A profil megtekintéséhez bejelentkezés szükséges.');
      }
      if (String(authUser.id) !== String(id) && authUser.role !== 'admin') {
        return forbidden(res, 'Más felhasználó profilja nem érhető el.');
      }
    }
    return next();
  }

  // Registration + login lookups must stay available.
  if (resource === 'users' && req.method === 'POST') {
    // Server-side validation for registration
    const body = req.body ?? {};
    const email = String(body.email || '').trim();
    const password = body.password;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Érvénytelen email.' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'A jelszó túl rövid.' });
    }
    // hash password server-side and store as passwordHash
    try {
      const hashed = crypto.createHash('sha256').update(String(password), 'utf8').digest('hex');
      req.body.passwordHash = hashed;
      delete req.body.password;
    } catch (e) {
      return res.status(500).json({ error: 'UNKNOWN_ERROR', message: 'Nem sikerült a jelszó feldolgozása.' });
    }
    // sanitize stored fields
    req.body = sanitizeObject(req.body);
    return next();
  }

  // Writes require authentication.
  if (!authUser) {
    return unauthorized(res, 'A művelethez bejelentkezés szükséges.');
  }

  const authUserId = String(authUser.id);
  const isAdmin = authUser.role === 'admin';

  // User profile updates: only self or admin.
  if (resource === 'users' && id) {
    if (String(id) !== authUserId && !isAdmin) {
      return forbidden(res, 'A saját profilon kívül nem módosíthatsz felhasználót.');
    }
    return next();
  }

  // Forum rules: only author or admin can edit/delete; authorUserId must match.
  if (resource === 'forumTopics') {
    if (req.method === 'POST') {
      if (String(req.body?.authorUserId) !== authUserId && !isAdmin) {
        return forbidden(res, 'A témát csak a saját nevedben hozhatod létre.');
      }
      // server-side validation
      const title = String(req.body?.title || '').trim();
      const bodyText = String(req.body?.body || '').trim();
      if (!title || title.length < 3) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: 'A téma címe túl rövid.' });
      }
      if (!bodyText || bodyText.length < 3) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: 'A téma törzse túl rövid.' });
      }
      req.body = sanitizeObject(req.body);
      return next();
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const keys = Object.keys(req.body ?? {});
      const isOnlyReplyCountPatch = keys.length > 0 && keys.every((key) => key === 'replyCount' || key === 'updatedAt');
      if (isOnlyReplyCountPatch) {
        return next();
      }
    }

    if (id) {
      const existing = router.db.get('forumTopics').find({ id: String(id) }).value();
      if (!existing) {
        return next();
      }
      if (String(existing.authorUserId) !== authUserId && !isAdmin) {
        return forbidden(res, 'Csak a téma szerzője (vagy admin) módosíthat/törölhet.');
      }
    }

    return next();
  }

  if (resource === 'forumReplies') {
    if (req.method === 'POST') {
      if (String(req.body?.authorUserId) !== authUserId && !isAdmin) {
        return forbidden(res, 'A hozzászólást csak a saját nevedben hozhatod létre.');
      }
      const bodyText = String(req.body?.body || req.body?.content || '').trim();
      if (!bodyText || bodyText.length < 1) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: 'A hozzászólás üres.' });
      }
      req.body = sanitizeObject(req.body);
      return next();
    }

    if (id) {
      const existing = router.db.get('forumReplies').find({ id: String(id) }).value();
      if (!existing) {
        return next();
      }
      if (String(existing.authorUserId) !== authUserId && !isAdmin) {
        return forbidden(res, 'Csak a hozzászólás szerzője (vagy admin) módosíthat/törölhet.');
      }
    }

    return next();
  }

  // Default: allow authenticated writes.
  return next();
});

server.use(API_PREFIX, router);

// Hide sensitive fields in responses (e.g., passwordHash)
router.render = (req, res) => {
  const data = res.locals.data;
  const authUser = req.authUser;

  function stripSensitive(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = Array.isArray(obj) ? [] : {};
    for (const k of Object.keys(obj)) {
      if (k === 'passwordHash') continue;
      const v = obj[k];
      copy[k] = v && typeof v === 'object' ? stripSensitive(v) : v;
    }
    return copy;
  }

  let out = data;
  // If returning users list or a user, strip passwordHash unless requester is admin
  const requestUrl = String(req.originalUrl || req.url || '');
  if (requestUrl.startsWith(`${API_PREFIX}/users`)) {
    const isAdmin = authUser && authUser.role === 'admin';
    if (!isAdmin) {
      out = Array.isArray(data) ? data.map(stripSensitive) : stripSensitive(data);
    }
  }

  res.json(out);
};

// SPA fallback when deployed as a single service
if (hasBuiltFrontend) {
  server.get('*', (req, res, next) => {
    if (req.path.startsWith(API_PREFIX)) {
      return next();
    }

    return res.sendFile(path.join(browserDistDir, 'index.html'));
  });
}

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`json-server (with auth rules) running on http://localhost:${port}`);
});
