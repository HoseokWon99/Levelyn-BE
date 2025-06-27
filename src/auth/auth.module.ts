import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { UsersModule, UsersService } from "../users";
import { User } from "../users/model";
import { AuthController } from './controller';
import { AuthService, BlacklistService, JwtAuthService } from './service';
import { JwtAuthGuard } from "./jwt.auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { OptionsProvider } from "../common";
import { JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, JWT_SECRET } from "./token";
import { KakaoOAuth2Guard, OAuth2Module } from "../config/oauth2";

const EXTERNAL_PROVIDERS = [
    UsersService,
    JwtService,
    KakaoOAuth2Guard
];

@Module({
  imports: [
      TypeOrmModule.forFeature([User]),
      PassportModule.register({ session: false }),
      JwtModule.register({}),
      OAuth2Module,
      UsersModule
  ],
  controllers: [AuthController],
  providers: [
      ...EXTERNAL_PROVIDERS,
      AuthService,
      JwtAuthService,
      BlacklistService,
      JwtStrategy,
      JwtAuthGuard,
      OptionsProvider<string>(JWT_SECRET),
      OptionsProvider<number>(JWT_ACCESS_EXPIRES),
      OptionsProvider<number>(JWT_REFRESH_EXPIRES)
  ],
  exports: [
      JwtAuthGuard,
      JwtAuthService,
      BlacklistService,
      JWT_SECRET,
      JWT_ACCESS_EXPIRES,
      JWT_REFRESH_EXPIRES,
  ]
})
export class AuthModule {}
