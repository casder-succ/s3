import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';

import type { Response } from 'express';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
  ) {}

  @Get()
  async findAll() {
    return this.filesService.findAll();
  }

  @Post('move')
  async moveFile(
    @Body() moveFileDto: {
      fromPath: string;
      toPath: string;
    },
  ) {
    return this.filesService.moveFile(moveFileDto);
  }

  @Post('copy')
  async copyFile(
    @Body() copyFileDto: {
      fromPath: string;
      toPath: string;
    },
  ) {
    return this.filesService.copyFile(copyFileDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get('views/:key')
  async viewFile(
    @Param('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.filesService.viewFile(key);

    if (file.private && res.getHeader('Referer') !== 'http://localhost:3002/') {
      return res.status(403).send('Forbidden');
    }

    res.setHeader('Content-Type', file.mimetype)
    res.setHeader('Content-Disposition', `inline; filename=${file.originalname}`);

    const fileStream = fs.createReadStream(file.path);
    return new StreamableFile(fileStream);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: {
      originalname?: string;
      description?: string;
      private?: boolean;
    },
  ) {
    return this.filesService.update(id, updateUserDto);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './files',
      filename: (req, file, cb) => {
        const randomName = Array(8)
          .fill(null)
          .map(() => (
            Math.round(Math.random() * 16)).toString(16),
          )
          .join('');
        const fileName = `${randomName}_${file.originalname}`.replace(/\s+/g, '');

        return cb(null, fileName);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.saveFile(file);
  }
}
