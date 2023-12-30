import { Document } from 'mongoose';

export interface IFile extends Document {
  originalname: string;
  description: string;
  path: string;
  private: boolean;
  readonly filename: string;
  readonly size: number;
  readonly key: string;
  readonly url: string;
  readonly mimetype: string;
  readonly extension: string;
  readonly views: number;
  readonly lastAccess: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
