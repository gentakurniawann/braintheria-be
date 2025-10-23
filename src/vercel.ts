// src/vercel.ts
import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import cookieSession from 'cookie-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';

const SESSION_NAME = process.env.SESSION_NAME || 'sid';
const SESSION_SECRET =
  process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const IS_PROD = process.env.NODE_ENV === 'production';

let cachedServer: ReturnType<typeof serverless> | null = null;

// simple fast health endpoint (before Nest) to verify the lambda returns
function mountPreNestRoutes(app: express.Express) {
  app.get('/__health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // Avoid long-lived connections on Serverless — short-circuit SSE here.
  app.get('/sse/stream', (_req, res) => {
    res.status(501).json({
      error: 'SSE not supported on Serverless function. Move to Edge or a VM.',
    });
  });
}

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  );
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

async function bootstrapServer() {
  const expressApp = express();

  // behind Vercel proxy – needed for proper secure cookie behavior
  expressApp.set('trust proxy', 1);

  // Pre-Nest fast routes
  mountPreNestRoutes(expressApp);

  // Cookies + session (stateless cookie-based session for serverless)
  expressApp.use(cookieParser());
  expressApp.use(
    cookieSession({
      name: SESSION_NAME,
      secret: SESSION_SECRET,
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD, // true on https domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }),
  );

  // Passport
  expressApp.use(passport.initialize());
  expressApp.use(passport.session());

  // CORS (fast preflight)
  expressApp.use(corsMiddleware);

  // NOTE: Nest will add its own body parsers; no need to add express.json() here
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  // If you have global pipes/filters, set them here
  // app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.init(); // IMPORTANT: do NOT call app.listen()

  // Wrap Express in a lambda handler
  return serverless(expressApp, {
    // Keep default; adding callbacks here rarely helps with timeouts
  });
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!cachedServer) {
      cachedServer = await bootstrapServer();
    }

    // Return/await the promise so Vercel knows when to finish the request
    return await cachedServer(req, res);
  } catch (err) {
    console.error('[vercel handler error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
