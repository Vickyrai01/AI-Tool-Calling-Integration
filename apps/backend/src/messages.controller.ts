import { Body, Controller, Post } from '@nestjs/common';

@Controller('messages')
export class MessagesController {
  @Post()
  create(
    @Body()
    body: {
      conversationId: string;
      role: 'user' | 'assistant';
      content: string;
    },
  ) {
    // Día 1: stub
    return { ok: true, body };
  }
}
