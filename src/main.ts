import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';

const expressApp = express();

async function createNestApp(expressInstance: express.Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // 1️⃣ Parse cookies before sessions
  app.use(cookieParser());

  // 2️⃣ Session must come before passport.session()
  app.use(
    session({
      secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      },
    }),
  );

  // 3️⃣ Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // 4️⃣ Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.init();
  return app;
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  createNestApp(expressApp).then(() => {
    const port = process.env.PORT || 3001;
    expressApp.listen(port, () => {
      console.log(`[BOOT] Server ready → http://localhost:${port}`);
    });
  });
}

// For Vercel serverless
createNestApp(expressApp).catch((err) => {
  console.error('[BOOT] Failed to initialize Nest app:', err);
});

export default expressApp;