import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private users: UsersService,
  ) {}

  async validateOrCreateUser(google: { email: string; name?: string }) {
    let user = await this.users.findByEmail(google.email);
    if (!user)
      user = await this.users.create({
        email: google.email,
        name: google.name,
      });
    return user;
  }

  sign(user: { id: number; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}
