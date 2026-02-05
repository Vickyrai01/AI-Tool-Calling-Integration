import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop() title?: string;
  @Prop() userId?: string;

  @Prop({ type: Date }) createdAt?: Date;
  @Prop({ type: Date }) updatedAt?: Date;

  @Prop() lastMessagePreview?: string;
  @Prop() lastMessageAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
