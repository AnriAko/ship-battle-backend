import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<User>;

@Schema({ versionKey: false })
export class User {
    @ApiProperty({
        description: 'The unique identifier for the user.',
        example: 'b1f53c85-29a2-48cd-99fe-d2b1e9c72616',
        type: String,
    })
    @Prop({ type: String, default: uuidv4 })
    _id: string;

    @ApiProperty({
        description: 'The email address of the user. Must be a valid email.',
        example: 'user@example.com',
        type: String,
        uniqueItems: true,
    })
    @Prop({ type: String, required: true, unique: true })
    email: string;

    @ApiProperty({
        description: 'The nickname of the user. Must be unique.',
        example: 'userNickname',
        type: String,
        uniqueItems: true,
    })
    @Prop({ type: String, required: true, unique: true })
    nickname: string;

    @ApiProperty({
        description: 'The password of the user.',
        example: 'securepassword123',
        type: String,
    })
    @Prop({ required: true })
    password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
