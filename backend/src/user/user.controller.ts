import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateAssignmentRequestDto } from './dto/create-assignment-request.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/lib/auth.guard';
import type { ExpressRequest } from 'src/lib/auth.guard';
import { Roles } from 'src/lib/roles.decorator';
import { RolesGuard } from 'src/lib/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LinkGlobalUserDto } from './dto/link-global-user.dto';
import { LoginDto } from './dto/login.dto';
import { PublicSignupDto } from './dto/public-signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterWorkerDto } from './dto/register-worker.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateAssignmentRequestStatusDto } from './dto/update-assignment-request-status.dto';
import { UserRole } from './entities/user.entity';
import { AuthResponse, UserResponse, UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.userService.login(loginDto);
  }

  @Post('register-worker')
  registerWorker(@Body() dto: RegisterWorkerDto): Promise<AuthResponse> {
    return this.userService.registerWorker(dto);
  }

  @Post('public-signup')
  publicSignup(@Body() dto: PublicSignupDto): Promise<AuthResponse> {
    return this.userService.publicSignup(dto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.userService.refreshToken(refreshTokenDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post('create')
  createManaged(
    @Req() req: ExpressRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<AuthResponse | { message: string; user: UserResponse }> {
    return this.userService.createManagedUser(req.user, createUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Post('link-global-user')
  linkGlobalUser(
    @Req() req: ExpressRequest,
    @Body() dto: LinkGlobalUserDto,
  ): Promise<{ message: string; user: UserResponse }> {
    return this.userService.linkExistingGlobalUser(req.user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@Req() req: ExpressRequest): Promise<UserResponse> {
    return this.userService.getMe(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Req() req: ExpressRequest): Promise<{ message: string }> {
    return this.userService.logout(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TETENTWONER)
  @Get()
  findAll(@Req() req: ExpressRequest): Promise<UserResponse[]> {
    return this.userService.findAllForActor(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('search')
  search(
    @Req() req: ExpressRequest,
    @Query() query: SearchUsersDto,
  ): Promise<UserResponse[]> {
    return this.userService.searchUsers(req.user, query);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('assignment-requests')
  findRequests(@Req() req: ExpressRequest): Promise<any[]> {
    return this.userService.findAssignmentRequests(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('assignment-requests')
  createRequest(
    @Req() req: ExpressRequest,
    @Body() dto: CreateAssignmentRequestDto,
  ): Promise<any> {
    return this.userService.createAssignmentRequest(req.user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('assignment-requests/:id')
  updateRequest(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentRequestStatusDto,
  ): Promise<any> {
    return this.userService.updateAssignmentRequestStatus(req.user, id, dto);
  }
}
