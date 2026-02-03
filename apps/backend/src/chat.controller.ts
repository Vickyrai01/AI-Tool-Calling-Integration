import { Controller, Post, Body } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  @Post()
  async postMessage(@Body() body: { text: string }) {
    const text = String(body?.text ?? '');
    if (!text) return { error: 'Input inválido' };
    return { text: `Recibido: ${text}. Backend OK.` };
  }
}

