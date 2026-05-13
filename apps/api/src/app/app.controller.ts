import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  getData() {
    return this.appService.getData();
  }
}
