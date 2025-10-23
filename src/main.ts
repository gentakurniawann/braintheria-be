import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // console.log('[BOOT] Starting Nest app...');
  // console.log('[BOOT] ENV:', {
  //   PORT: process.env.PORT,
  //   FRONTEND_URL: process.env.FRONTEND_URL,
  //   GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  // });

  // 1️⃣ Parse cookies before sessions
  app.use(cookieParser());
  // console.log('[BOOT] cookieParser loaded');

  // 2️⃣ Session must come before passport.session()
  app.use(
    session({
      secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }),
  );
  // console.log('[BOOT] session initialized');

  // 3️⃣ Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());
  // console.log('[BOOT] passport initialized');

  // 4️⃣ Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  // console.log('[BOOT] CORS enabled for', process.env.FRONTEND_URL);

  // 5️⃣ Start server
  await app.listen(process.env.PORT || 3001);
  // console.log(
  //   `[BOOT] Server ready → http://localhost:${process.env.PORT || 3001}`,
  // );
}

bootstrap();
