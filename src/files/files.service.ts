import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { IFile } from './entity/files.interface';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs/promises';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel('Files') private readonly fileModel: Model<IFile>,
  ) {}

  async findOne(id: string): Promise<IFile> {
    const file = await this.fileModel.findById(id).exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async viewFile(key: string) {
    const file = await this.fileModel.findOne({ key }).exec();
    await this.fileModel.updateOne({ key }, {
      lastAccess: new Date(),
      $inc: { views: 1 }
    }).exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async update(id: string, file: {
    originalname?: string;
    description?: string;
    private?: boolean;
  }): Promise<IFile> {
    const fileDoc = await this.fileModel.findById(id);

    if (!fileDoc) {
      throw new NotFoundException('File not found');
    }

    const { originalname, description, private: isPrivate } = file;

    fileDoc.description = description || fileDoc.description;
    fileDoc.private = isPrivate || fileDoc.private;
    fileDoc.originalname = originalname?.concat(fileDoc.extension) || fileDoc.originalname;

    const randomName = Array(8)
      .fill(null)
      .map(() => (
        Math.round(Math.random() * 16)).toString(16),
      )
      .join('');

    const newPath = 'files/'.concat(randomName).concat('_').concat(fileDoc.originalname.replace(/\s+/g, ''));

    await fs.rename(
      fileDoc.path,
      newPath,
    );

    fileDoc.path = newPath;

    return fileDoc.save();
  }

  async findAll(): Promise<IFile[]> {
    return this.fileModel.find().exec();
  }

  async remove(id: string): Promise<IFile> {
    const file = await this.fileModel.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await fs.unlink(file.path);
    return this.fileModel.findByIdAndDelete(id, { new: true });
  }

  async saveFile(file: Express.Multer.File) {
    const fileKey = Array(32)
      .fill(null)
      .map(() => (
        Math.round(Math.random() * 16)).toString(16)
      )
      .join('');

    const createdFile = new this.fileModel({
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      key: fileKey,
      filename: file.filename,
      originalname: file.originalname,
      url: `http://localhost:3000/files/views/${fileKey}`,
      extension: '.'.concat(file.originalname.split('.').pop()),
    });

    return createdFile.save();
  }

  async moveFile(updateFileDto: { fromPath: string, toPath: string }) {
    const file = await this.fileModel.findOne({ path: updateFileDto.fromPath });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.path === updateFileDto.toPath) {
      throw new ForbiddenException('File already exists');
    }

    if (!updateFileDto.toPath.startsWith('files/')) {
      throw new ForbiddenException('Invalid path');
    }

    const dirExists = await fs.stat(updateFileDto.toPath.split('/').slice(0, -1).join('/')).catch(() => false);

    if (!dirExists) {
      await fs.mkdir(updateFileDto.toPath.split('/').slice(0, -1).join('/'), {
        recursive: true,
      });
    }
    await fs.rename(updateFileDto.fromPath, updateFileDto.toPath);

    file.path = updateFileDto.toPath;

    return file.save();
  }

  async copyFile(updateFileDto: { fromPath: string, toPath: string }) {
    const file = await this.fileModel.findOne({ path: updateFileDto.fromPath }).exec();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.path === updateFileDto.toPath) {
      throw new ForbiddenException('File already exists');
    }

    if (!updateFileDto.toPath.startsWith('files/')) {
      throw new ForbiddenException('Invalid path');
    }

    const fileKey = Array(32)
      .fill(null)
      .map(() => (
        Math.round(Math.random() * 16)).toString(16)
      )
      .join('');

    const dirExists = await fs.stat(updateFileDto.toPath.split('/').slice(0, -1).join('/')).catch(() => false);

    if (!dirExists) {
      await fs.mkdir(updateFileDto.toPath.split('/').slice(0, -1).join('/'), {
        recursive: true,
      });
    }
    await fs.copyFile(updateFileDto.fromPath, updateFileDto.toPath, fs.constants.COPYFILE_EXCL);

    const newFile = new this.fileModel({
      ...file.toObject(),
      _id: new mongoose.Types.ObjectId(),
      path: updateFileDto.toPath,
      key: fileKey,
      url: `http://localhost:3000/files/views/${fileKey}`,
    });

    return newFile.save();
  }
}
