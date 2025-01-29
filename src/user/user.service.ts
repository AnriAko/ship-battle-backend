import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { logger } from 'src/common/winston-logger';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>
    ) {}
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
    async updateUserPassword(id: string, newPassword: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                id,
                { $set: { password: newPassword } },
                { new: true }
            )
            .select('-password -_id');

        return updatedUser;
    }
    async updateUser(id: string, userInfo: UpdateUserDto): Promise<User> {
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { $set: userInfo }, { new: true })
            .select('-password -_id');
        return updatedUser;
    }
    async updateUserNickname(id: string, newNickName: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (newNickName !== user.nickname) {
            if (await this.findUserByNickname(newNickName)) {
                throw new ConflictException('Such nickname already exist');
            }
        } else {
            throw new BadRequestException(
                'You cannot change your nickname to the same one'
            );
        }
        console.log(newNickName);
        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                id,
                { $set: { nickname: newNickName } },
                { new: true }
            )
            .select('-password -_id');

        return updatedUser;
    }
    async updateUserEmail(id: string, newEmail: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (newEmail !== user.email) {
            if (await this.findUserByEmail(newEmail)) {
                throw new ConflictException('Such email already exist');
            }
        } else {
            throw new BadRequestException(
                'You cannot change your email to the same one'
            );
        }
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { $set: { email: newEmail } }, { new: true })
            .select('-password -_id');

        return updatedUser;
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
