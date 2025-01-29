import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        description: 'The email address of the user. Must be a valid email.',
        example: 'user@example.com',
        type: String,
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'The nickname of the user.',
        example: 'username',
        type: String,
    })
    @IsNotEmpty()
    nickname: string;

    @ApiProperty({
        description:
            'The password for the user account. Should be between 8 and 20 characters.',
        example: 'pass1234',
        type: String,
    })
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(20)
    password: string;
}
