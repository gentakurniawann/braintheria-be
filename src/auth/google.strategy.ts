import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  StrategyOptions,
} from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // console.log('[INIT] GoogleStrategy initialized with:', {
    //   clientID,
    //   clientSecret: clientSecret ? '***' : undefined,
    //   callbackURL,
    // });

    super(<StrategyOptions>{
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    
    // console.log('[VALIDATE] Google profile received:', {
    //   id: profile.id,
    //   email: profile.emails?.[0]?.value,
    //   name: profile.displayName,
    //   accessToken,
    // });

    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
      accessToken,
    };

    // console.log('[VALIDATE] User object created:', user);
    done(null, user);
  }
}
