import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from './categories/categories.module';
import { TrapsModule } from './traps/traps.module';
import { TranslationModule } from './translation/translation.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const envName = configService.get<string>('ENV_NAME', 'LOCAL');
        const isLocal = envName === 'LOCAL';

        if (isLocal) {
          const host = configService.get<string>('MONGO_HOST', 'localhost');
          const port = configService.get<string>('MONGO_PORT', '27017');
          const dbName = configService.get<string>('MONGO_NAME', 'mdr-categories');
          const user = configService.get<string>('MONGO_USER', '');
          const password = configService.get<string>('MONGO_PASSWORD', '');
          const ssl = configService.get<string>('MONGO_SSL', 'false');

          let uri: string;
          if (user && password) {
            uri = `mongodb://${user}:${password}@${host}:${port}/${dbName}?ssl=${ssl}`;
          } else {
            uri = `mongodb://${host}:${port}/${dbName}`;
          }

          return {
            uri,
            maxPoolSize: parseInt(configService.get<string>('MONGO_POOL_SIZE', '100'), 10),
          };
        }

        // Production: use MONGO_URI or construct from parts
        const mongoUri = configService.get<string>('MONGO_URI');
        if (mongoUri) {
          return { uri: mongoUri };
        }

        const host = configService.get<string>('MONGO_HOST', 'localhost');
        const dbName = configService.get<string>('MONGO_NAME', 'mdr-categories');
        const user = configService.get<string>('MONGO_USER', '');
        const password = configService.get<string>('MONGO_PASSWORD', '');

        return {
          uri: `mongodb+srv://${user}:${password}@${host}/${dbName}?retryWrites=true&w=majority`,
          maxPoolSize: parseInt(configService.get<string>('MONGO_POOL_SIZE', '100'), 10),
        };
      },
      inject: [ConfigService],
    }),
    CategoriesModule,
    TrapsModule,
    TranslationModule,
    HealthModule,
  ],
})
export class AppModule {}
