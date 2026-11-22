import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

export function createSessionMiddleware(pool, secret) {
  return session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: 15,
    }),
    name: 'smartscan.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}
