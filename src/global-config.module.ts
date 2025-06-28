import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'FILE_STORAGE_PATH',
      useValue: 'D:/Task Management/file',
    },
  ],
  exports: ['FILE_STORAGE_PATH'],
})
export class GlobalConfigModule {}
