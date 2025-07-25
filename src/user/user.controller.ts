import { Body, Controller, HttpCode, HttpStatus, Post, Logger } from '@nestjs/common';
import { UserService } from './user.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private readonly logger = new Logger(UserController.name);

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto) {
    this.logger.log(`POST /user/register - identifier: ${dto.identifier}`);
    const result = await this.userService.registerUser(dto);
    this.logger.log(`User registration completed for ${dto.identifier}`);
    return result;
  }
}
