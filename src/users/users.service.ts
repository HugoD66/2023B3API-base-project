import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRoleEnum } from './entities/types/user.role.enum';
import { UserResponseDto } from './dto/user-response-dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const user: User = this.usersRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role ?? UserRoleEnum.Employee,
    });
    const savedUser: User = await this.usersRepository.save(user);
    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user: User = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid password');
    }
    const payload = { sub: user.id, email: user.email };
    return {
      ...user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'role', 'email', 'employeeReferring'],
    });
  }

  async findAll(): Promise<UserResponseDto[]> {
    return await this.usersRepository.find();
  }
}
