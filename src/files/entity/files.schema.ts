import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { now } from 'mongoose';

@Schema({ timestamps: true })
export class File {
  @Prop()
  originalname: string;

  @Prop()
  filename: string;

  @Prop()
  size: number;

  @Prop({ default: '' })
  description: string;

  @Prop()
  key: string;

  @Prop()
  url: string;

  @Prop()
  mimetype: string;

  @Prop()
  path: string;

  @Prop()
  extension: string;

  @Prop({ default: false })
  private: boolean;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: now() })
  lastAccess: Date;

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
