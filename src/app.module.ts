import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReviewModule } from './review/review.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';

console.log(ConfigModule.forRoot());

@Module({
  imports: [ReviewModule, ConfigModule.forRoot(), UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
