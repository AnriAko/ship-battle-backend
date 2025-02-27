import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { logger } from 'src/common/winston-logger';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Request as RequestExpress } from 'express';

@Injectable()
export class UserService {
    private readonly saltRounds: number;
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        private configService: ConfigService
    ) {
        this.saltRounds =
            parseInt(this.configService.get<string>('SALT_ROUNDS'), 10) || 12;
    }
    async createUser(createUserDto: CreateUserDto): Promise<User> {
        return this.userModel.create(createUserDto);
    }
    async findAllUsers(): Promise<User[]> {
        return this.userModel.find().select('-password');
    }
    async findUserById(id: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
    async findUserByEmail(email: string): Promise<User | null> {
        const user = await this.userModel.findOne({ email: email });
        if (!user) return null;
        return user;
    }
    async findUserByNickname(nickname: string): Promise<User | null> {
        const user = await this.userModel.findOne({ nickname: nickname });
        if (!user) return null;
        return user;
    }
    async checkIfPasswordMatches(
        req: RequestExpress,
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

    async updateUser(
        id: string,
        updateUserDto: UpdateUserDto,
        @Req() req: RequestExpress
    ) {
        const user = await this.findUserById(id);
        await this.checkIfPasswordMatches(req, user, updateUserDto.password);

        if (
            (updateUserDto.email &&
                updateUserDto.email !== user.email &&
                (await this.findUserByEmail(updateUserDto.email))) ||
            (updateUserDto.nickname &&
                updateUserDto.nickname !== user.nickname &&
                (await this.findUserByNickname(updateUserDto.nickname)))
        ) {
            throw new ConflictException('Email or nickname already exists');
        }

        if (
            updateUserDto.email === user.email ||
            updateUserDto.nickname === user.nickname
        ) {
            throw new ConflictException(
                'You cannot change email or nickname to the same one'
            );
        }

        if (updateUserDto.newPassword === updateUserDto.password) {
            throw new ConflictException(
                'You cannot change password to the same one'
            );
        }

        const hashedPassword = updateUserDto.newPassword
            ? await bcrypt.hash(updateUserDto.newPassword, this.saltRounds)
            : user.password;

        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                id,
                {
                    $set: {
                        email: updateUserDto.email,
                        nickname: updateUserDto.nickname,
                        password: hashedPassword,
                    },
                },
                { new: true }
            )
            .select('-password -_id');

        return {
            message: 'User updated successfully',
            user: {
                email: updatedUser.email,
                nickname: updatedUser.nickname,
            },
        };
    }
    async deleteUser(id: string): Promise<void> {
        try {
            const user = await this.userModel.findByIdAndDelete(id);
            if (!user) {
                throw new NotFoundException('User not found');
            }
        } catch (error) {
            logger.error(`SignIn error: ${error.message}`, {
                stack: error.stack,
            });
            throw new InternalServerErrorException(
                'Something went wrong during user deletion'
            );
        }
    }
}
