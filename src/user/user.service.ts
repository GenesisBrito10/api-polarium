import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import { RegisterUserDto } from './dto/register-user.dto.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly url = 'https://api.trade.polariumbroker.com/v3/users/register';
  private readonly cookie = 'aff=757416; afftrack=telegram; retrack=; affextra=; aff_ts=2025-06-10T16:13:52.033Z; aff_model=revenue; platform=317; _gcl_au=1.1.282943001.1749572032; _ga_WD6ZQ2LZC2=GS2.1.s1749572032$o1$g0$t1749572032$j60$l0$h1095895671; _ga=GA1.1.436484785.1749572032; _ga_MXH1SPJQFX=GS2.1.s1749572032$o1$g0$t1749572032$j60$l0$h490209231; _ga_XRRG8H1EGE=GS2.1.s1749572032$o1$g0$t1749572032$j60$l0$h1072125746; _fbp=fb.1.1749572032090.970139667745554775; landing=trade.polariumbroker.com; lang=pt_PT; pll_language=pt; _vid_t=aFHOLf9YnoopdkWwU4WYcGEU6Fy4o8eTmrTU9WrnV3ZGje3X6FsnRfuSpaufu0COz4qVqRg8oCz2WAKkS6hpIQX34zCX/F+HRW32Z40=; device_id=2qdDDWG0A1BIyNZsi7F3; device_id=2qdDDWG0A1BIyNZsi7F3; ssid=4e20418e24fe313ce7b6caf77826d3cr';

  async registerUser(dto: RegisterUserDto): Promise<any> {
    const payload = {
      identifier: dto.identifier,
      password: dto.password,
      accepted: ['terms', 'privacy policy'],
      country_id: 30,
      first_name: dto.first_name,
      last_name: dto.last_name,
      timezone: 'America/Recife',
    };

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'content-type': 'application/json',
          origin: 'https://trade.polariumbroker.com',
          priority: 'u=1, i',
          referer: 'https://trade.polariumbroker.com/',
          'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
          Cookie: this.cookie,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Registration failed: ${response.status} ${text}`);
        throw new InternalServerErrorException(text.message || 'Erro ao registrar usuário');
      }

      return response.json();
    } catch (error) {
      this.logger.error(`Error registering user: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Erro ao registrar usuário');
    }
  }
}
