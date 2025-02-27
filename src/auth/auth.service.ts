import {
    Injectable,
    Inject,
    ConflictException,
    UnauthorizedException,
    Req,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { SignInUserDto } from 'src/user/dto/signIn-user.dto';
import { JwtService } from '@nestjs/jwt';
import { logger } from 'src/common/winston-logger';
import { Request } from 'express';
import { User } from 'src/user/schema/user.schema';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private readonly saltRounds: number;

    constructor(
        @Inject(UserService) private readonly userService: UserService,
        @Inject(JwtService) private readonly jwtService: JwtService,
        private configService: ConfigService
    ) {
        this.saltRounds =
            parseInt(this.configService.get<string>('SALT_ROUNDS'), 10) || 12;
    }

    async signUp(createUserDto: CreateUserDto): Promise<string> {
        const { email, nickname, password } = createUserDto;

        if (await this.userService.findUserByEmail(email)) {
            throw new ConflictException('Email already exist');
        }
        if (await this.userService.findUserByNickname(nickname)) {
            throw new ConflictException('This nickname already exist');
        }

        const hashedPassword = await bcrypt.hash(password, this.saltRounds);

        const userWithHashedPassword = {
            email: email,
            nickname: nickname,
            password: hashedPassword,
        };

        const newUser = await this.userService.createUser(
            userWithHashedPassword
        );

        const payload = this.createPayload(newUser);
        const accessToken = this.generateToken(payload);

        logger.info(
            `User ${nickname} with email: ${email} successfully signed up`
        );
        return accessToken;
    }

    async signIn(
        signInUserDto: SignInUserDto,
        @Req() req: Request
    ): Promise<string> {
        const { email, password } = signInUserDto;
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        await this.userService.checkIfPasswordMatches(req, user, password);

        const payload = this.createPayload(user);
        const accessToken = this.generateToken(payload);
        return accessToken;
    }
    private createPayload(user: { _id: string }): {
        sub: string;
    } {
        return { sub: user._id };
    }
    private generateToken(payload: { sub: string }): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '1d',
        });
    }
}
