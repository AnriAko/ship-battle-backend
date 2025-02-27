import {
    Controller,
    Inject,
    Get,
    UseGuards,
    Request,
    Body,
    Patch,
    Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { User } from './schema/user.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request as RequestExpress } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(
        @Inject(UserService) private readonly userService: UserService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({
        status: 200,
        description: 'List of all users without passwords',
        type: [User],
    })
    async getAllUsers() {
        return this.userService.findAllUsers();
    }

    @Get('/profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: `Get user's profile` })
    @ApiResponse({
        status: 200,
        description: 'Users profile without password',
        type: User,
    })
    async getUserProfile(@Request() req: RequestExpress) {
        const userId = (req as any).userId;
        return this.userService.findUserById(userId);
    }

    @ApiBearerAuth()
    @Patch('update')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update user data' })
    @ApiBody({
        description: 'User update data',
        type: UpdateUserDto,
    })
    @ApiResponse({
        status: 200,
        description: 'User data successfully updated',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'User updated successfully',
                },
                user: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            example: 'user@example.com',
                        },
                        nickname: {
                            type: 'string',
                            example: 'username123',
                        },
                    },
                },
            },
        },
    })
    async updateUser(
        @Req() req: RequestExpress,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const userId = (req as any).userId;
        return this.userService.updateUser(userId, updateUserDto, req);
    }
}
