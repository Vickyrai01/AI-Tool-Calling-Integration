import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async postMessage(@Body() body: { text: string; conversationId?: string }) {
    return this.chat.handleMessage(body.text, body.conversationId);
  }
}
