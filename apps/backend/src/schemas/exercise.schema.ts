import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExerciseDocument = HydratedDocument<Exercise>;

@Schema({ timestamps: true })
export class Exercise {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', required: false })
  messageId?: Types.ObjectId;

  @Prop({ required: true }) topic!: string;
  @Prop({ required: true }) difficulty!: string;
  @Prop({ required: true }) statement!: string;
  @Prop({ type: [String], required: true }) steps!: string[];
  @Prop({ required: true }) answer!: string;
  @Prop() sourceUrl?: string;

  @Prop({ type: Date }) createdAt?: Date;
  @Prop({ type: Date }) updatedAt?: Date;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
