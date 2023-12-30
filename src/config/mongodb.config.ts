import { ConfigService } from '@nestjs/config';

import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongodbConfig = async (
  configService: ConfigService,
): Promise<MongooseModuleOptions> => ({
  uri: configService.get<string>('MONGO_URI') as string,
});
