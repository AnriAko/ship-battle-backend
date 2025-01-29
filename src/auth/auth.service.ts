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
        await this.checkIfPasswordMatches(req, user, password);

        const payload = this.createPayload(user);
        const accessToken = this.generateToken(payload);
        return accessToken;
    }
    async updateUser(
        id: string,
        @Req() req: Request,
        updateUserDto: UpdateUserDto
    ) {
        const user = await this.userService.findUserById(id);
        await this.checkIfPasswordMatches(req, user, updateUserDto.password);
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            if (await this.userService.findUserByEmail(updateUserDto.email)) {
                throw new ConflictException('Email already exist');
            }
        }
        if (updateUserDto.email !== user.email) {
            throw new ConflictException(
                'You cannot change email on the same one'
            );
        }
        if (
            updateUserDto.nickname &&
            updateUserDto.nickname !== user.nickname
        ) {
            if (
                await this.userService.findUserByNickname(
                    updateUserDto.nickname
                )
            ) {
                throw new ConflictException('This nickname already exist');
            }
        }
        if (updateUserDto.nickname !== user.nickname) {
            throw new ConflictException(
                'You cannot change nickname on the same one'
            );
        }
        if (updateUserDto.newPassword === updateUserDto.password) {
            throw new ConflictException(
                'You cannot change password on the same one'
            );
        }
        let hashedPassword: string;
        if (updateUserDto.newPassword) {
            hashedPassword = await bcrypt.hash(
                updateUserDto.newPassword,
                this.saltRounds
            );
        } else hashedPassword = user.password;

        const updatedUserInfo = {
            email: updateUserDto.email,
            nickname: updateUserDto.nickname,
            password: hashedPassword,
        };
        const updatedUser = await this.userService.updateUser(
            id,
            updatedUserInfo
        );
        return {
            message: 'User updated successfully',
            user: {
                email: updatedUser.email,
                nickname: updatedUser.nickname,
            },
        };
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
    async checkIfPasswordMatches(
        @Req() req: Request,
        user: User,
        password: string
    ) {
        const ip = req.ip;
        const maskedIp = ip.replace(/\.\d+$/, '.xxx');
        const maskedEmail = user.email.replace(/(?<=.{2}).(?=.*@)/g, '*');

        if (!user) {
            logger.warn(
                `Failed sign in attempt with invalid email: ${maskedEmail}, IP:${maskedIp}`
            );
            throw new UnauthorizedException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(
                `Failed sign in attempt for email: ${maskedEmail} due to incorrect password, IP:${maskedIp}`
            );
            throw new UnauthorizedException('Invalid email or password');
        }
    }
}
