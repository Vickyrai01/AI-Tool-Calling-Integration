import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { Request, Response } from 'express';

function ensureClientId(req: Request, res: Response) {
  let id = req.cookies?.client_id as string | undefined;
  if (!id || typeof id !== 'string' || id.length < 8) {
    id = crypto.randomUUID();
    // Cookie HttpOnly de 180 días - sameSite: none para cross-site
    res.cookie('client_id', id, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 180 * 24 * 60 * 60 * 1000,
    });
  }
  return id;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async postMessage(
    @Body() body: { text: string; conversationId?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const clientId = ensureClientId(req, res);
    const result = await this.chat.handleMessage(
      body.text,
      body.conversationId,
      clientId,
    );
    return res.json(result);
  }
}
