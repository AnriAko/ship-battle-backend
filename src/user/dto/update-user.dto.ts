import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({
        description: 'The email address of the user. Must be a valid email.',
        example: 'newUser@example.com',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'The nickname of the user.',
        example: 'newUsername',
        type: String,
        required: false,
    })
    @IsOptional()
    nickname?: string;

    @ApiProperty({
        description:
            'The current password for the user account. Should be between 8 and 20 characters.',
        example: 'pass1234',
        type: String,
    })
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(20)
    password: string;

    @ApiProperty({
        description:
            'The new password for the user account. Should be between 8 and 20 characters.',
        example: 'pass12345',
        type: String,
        required: false,
    })
    @IsOptional()
    @MinLength(8)
    @MaxLength(20)
    newPassword?: string;
}
