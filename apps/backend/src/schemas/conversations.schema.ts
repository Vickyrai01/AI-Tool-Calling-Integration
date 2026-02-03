import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop() title?: string;
  @Prop() userId?: string;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
