// src/vercel.ts
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import cookieSession from 'cookie-session'; // stateless, serverless-friendly
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';

// If you prefer express-session with a store (e.g. Upstash/Redis), see note below.
const SESSION_NAME = process.env.SESSION_NAME || 'sid';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let cachedServer: any;

async function bootstrapServer() {
  const expressApp = express();

  // 1) Cookies
  expressApp.use(cookieParser());

  // 2) Session (serverless-safe): cookie-session keeps state in a signed cookie
  //    If you need server-side sessions, use express-session + Redis (see note).
  expressApp.use(
    cookieSession({
      name: SESSION_NAME,
      secret: SESSION_SECRET,
      // security flags – adjust for your domain/https
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true when you’re on https domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }),
  );

  // 3) Passport
  expressApp.use(passport.initialize());
  // With cookie-session there is no server store, but Passport will still call serialize/deserialize.
  expressApp.use(passport.session());

  // 4) CORS (mirror your main.ts)
  //    NOTE: Vercel proxy often adds its own headers; keep this simple.
  expressApp.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // 5) Create Nest app on the express adapter (no listen(), only init)
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });
  await app.init(); // IMPORTANT on serverless

  // Convert to a lambda-style handler
  return serverless(expressApp, {
    // config options if needed
  });
}

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) cachedServer = await bootstrapServer();
  return cachedServer(req, res);
}
