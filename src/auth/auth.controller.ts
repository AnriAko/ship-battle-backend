import {
    Body,
    Controller,
    HttpCode,
    Inject,
    Patch,
    Post,
    Request,
    Response,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { SignInUserDto } from 'src/user/dto/signIn-user.dto';
import {
    Response as ResponseExpress,
    Request as RequestExpress,
} from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        @Inject(AuthService) private readonly authService: AuthService
    ) {}

    @Post('signup')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({
        description: 'User registration data',
        type: CreateUserDto,
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'User created successfully',
                },
            },
        },
    })
    async signUp(
        @Body() createUserDto: CreateUserDto,
        @Response() res: ResponseExpress
    ) {
        const accessToken = await this.authService.signUp(createUserDto);
        res.setHeader('Authorization', `Bearer ${accessToken}`);
        return res.json({
            message: 'User created successfully',
        });
    }

    @Post('signin')
    @HttpCode(200)
    @ApiOperation({ summary: 'User sign-in' })
    @ApiBody({
        description: 'User sign-in data',
        type: SignInUserDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Successful sign-in',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Successful signIn' },
            },
        },
    })
    async signIn(
        @Body() signInUserDto: SignInUserDto,
        @Response() res: ResponseExpress,
        @Request() req: RequestExpress
    ) {
        const accessToken = await this.authService.signIn(signInUserDto, req);
        res.setHeader('Authorization', `Bearer ${accessToken}`);
        return res.json({
            message: 'Successful signIn',
        });
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
        @Request() req: RequestExpress,
        @Body() updateUserDto: UpdateUserDto
    ) {
        const userId = (req as any).userId;
        return this.authService.updateUser(userId, req, updateUserDto);
    }
}
