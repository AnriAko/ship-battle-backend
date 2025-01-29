import { Controller, Inject, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from './schema/user.schema';

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
}
