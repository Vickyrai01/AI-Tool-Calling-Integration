import { Controller, Get, Param } from '@nestjs/common';

@Controller('conversations')
export class ConversationsController {
  @Get()
  list() {
    // Día 1: stub
    return [{ id: 'stub', title: 'Demo' }];
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    // Día 1: stub
    return { id, messages: [] };
  }
}
