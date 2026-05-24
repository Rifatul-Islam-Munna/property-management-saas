import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from 'src/organization/entities/organization.entity';
import { CreateAssignmentRequestDto } from './dto/create-assignment-request.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LinkGlobalUserDto } from './dto/link-global-user.dto';
import { LoginDto } from './dto/login.dto';
import { PublicSignupDto } from './dto/public-signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterWorkerDto } from './dto/register-worker.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateAssignmentRequestStatusDto } from './dto/update-assignment-request-status.dto';
import {
  AssignmentRequest,
  AssignmentRequestDirection,
  AssignmentRequestDocument,
  AssignmentRequestStatus,
} from './entities/assignment-request.entity';
import {
  OwnerSubscriptionTier,
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './entities/user.entity';
import { JwtUser } from 'src/lib/auth.guard';

export type UserResponse = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  organizationId?: string | null;
  organizationIds: string[];
  jobTitle?: string | null;
  avatarUrl?: string | null;
  createdByUserId?: string | null;
  createdByRole?: UserRole | null;
  firstAddedByOwnerId?: string | null;
  ownerIds: string[];
  activeOwnerId?: string | null;
  propertyIds: string[];
  activePropertyId?: string | null;
  isGlobalProfile: boolean;
  subscriptionTier?: OwnerSubscriptionTier | null;
  subscriptionRequired: boolean;
  subscriptionActive: boolean;
  subscriptionStartsAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: Omit<UserResponse, 'createdAt' | 'updatedAt'>;
};

type AuthPayloadUser = {
  _id: string | { toString(): string };
  email: string;
  organizationId?: string | null;
  organizationIds: string[];
  jobTitle?: string | null;
  avatarUrl?: string | null;
  createdByUserId?: string | null;
  createdByRole?: UserRole | null;
  firstAddedByOwnerId?: string | null;
  ownerIds: string[];
  activeOwnerId?: string | null;
  propertyIds: string[];
  activePropertyId?: string | null;
  isGlobalProfile: boolean;
  subscriptionTier?: OwnerSubscriptionTier | null;
  subscriptionRequired: boolean;
  subscriptionActive: boolean;
  subscriptionStartsAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  role: UserRole;
  fullName: string;
  phoneNumber: string;
  status: UserStatus;
  lastLoginAt?: Date | null;
};

type UserRecord = AuthPayloadUser & {
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(AssignmentRequest.name)
    private readonly assignmentRequestModel: Model<AssignmentRequestDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const usersCount = await this.userModel.countDocuments();
    const requestedRole = createUserDto.role ?? UserRole.ADMIN;

    if (usersCount > 0) {
      throw new BadRequestException(
        'Public registration disabled. Admin or tenant owner must create users.',
      );
    }

    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(requestedRole)) {
      throw new BadRequestException(
        'First bootstrap user must be super_admin or admin.',
      );
    }

    const email = this.normalizeRequiredValue(createUserDto.email, 'Email required');
    const existingUser = await this.userModel.findOne({ email }).lean();

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userModel.create({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: requestedRole,
      status: UserStatus.ACTIVE,
      organizationIds: createUserDto.organizationId ? [createUserDto.organizationId] : [],
      ownerIds: [],
      activeOwnerId: null,
      propertyIds: createUserDto.propertyIds ?? [],
      activePropertyId: createUserDto.propertyIds?.[0] ?? null,
      isGlobalProfile: false,
      subscriptionTier:
        requestedRole === UserRole.TETENTWONER ? OwnerSubscriptionTier.STARTER : null,
      subscriptionRequired: requestedRole === UserRole.TETENTWONER,
      subscriptionActive: false,
      subscriptionStartsAt: null,
      subscriptionEndsAt: null,
    });

    return this.buildAuthResponse(user, true);
  }

  async registerWorker(dto: RegisterWorkerDto): Promise<AuthResponse> {
    const email = this.normalizeRequiredValue(dto.email, 'Email required');
    const existingUser = await this.userModel.findOne({ email }).lean();

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      ...dto,
      email,
      role: UserRole.WORKER,
      password: hashedPassword,
      organizationId: null,
      organizationIds: [],
      ownerIds: [],
      activeOwnerId: null,
      propertyIds: [],
      activePropertyId: null,
      isGlobalProfile: true,
      subscriptionTier: null,
      subscriptionRequired: false,
      subscriptionActive: false,
      subscriptionStartsAt: null,
      subscriptionEndsAt: null,
      status: UserStatus.ACTIVE,
    });

    return this.buildAuthResponse(user, true);
  }

  async publicSignup(dto: PublicSignupDto): Promise<AuthResponse> {
    if (
      ![UserRole.WORKER, UserRole.TETENTWONER, UserRole.RENTER, UserRole.GUEST].includes(
        dto.role,
      )
    ) {
      throw new BadRequestException(
        'Public signup supports worker, renter, guest, or tenant owner.',
      );
    }

    const email = this.normalizeRequiredValue(dto.email, 'Email required');
    const existingUser = await this.userModel.findOne({ email }).lean();

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const isGlobalUser = [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST].includes(dto.role);

    const user = await this.userModel.create({
      ...dto,
      email,
      password: hashedPassword,
      organizationId: null,
      organizationIds: [],
      ownerIds: [],
      activeOwnerId: null,
      propertyIds: [],
      activePropertyId: null,
      isGlobalProfile: isGlobalUser,
      subscriptionTier: dto.role === UserRole.TETENTWONER ? OwnerSubscriptionTier.STARTER : null,
      subscriptionRequired: dto.role === UserRole.TETENTWONER,
      subscriptionActive: false,
      subscriptionStartsAt: null,
      subscriptionEndsAt: null,
      status: UserStatus.ACTIVE,
    });

    if (dto.role === UserRole.TETENTWONER) {
      const organizationId = await this.createOwnerOrganization(user);
      user.organizationId = organizationId;
      user.organizationIds = [organizationId];
      await user.save();
    }

    return this.buildAuthResponse(user, true);
  }

  async searchUsers(actor: JwtUser, query: SearchUsersDto): Promise<UserResponse[]> {
    const search = query.q?.trim();
    const filter: Record<string, unknown> = {};

    if (query.role) {
      filter.role = query.role;
    } else if (actor.role === UserRole.TETENTWONER) {
      filter.role = { $in: [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST] };
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return users.map((user) => this.mapUser(user));
  }

  async createAssignmentRequest(
    actor: JwtUser,
    dto: CreateAssignmentRequestDto,
  ): Promise<any> {
    this.validateAssignmentRequest(actor, dto);

    const request = await this.assignmentRequestModel.create({
      direction: dto.direction,
      requesterUserId: actor.id,
      requesterRole: actor.role,
      targetUserId: dto.targetUserId ?? null,
      targetEmail: dto.targetEmail ? this.normalizeRequiredValue(dto.targetEmail, 'Target email required') : null,
      ownerUserId:
        actor.role === UserRole.TETENTWONER ? actor.id : dto.ownerUserId ?? null,
      organizationId: actor.organizationId ?? null,
      requestedRole: dto.requestedRole,
      propertyIds: this.normalizePropertyIds(dto.requestedRole, dto.propertyIds),
      message: dto.message ?? null,
      status: AssignmentRequestStatus.PENDING,
    });

    return request.toObject();
  }

  async findAssignmentRequests(actor: JwtUser): Promise<any[]> {
    const filter =
      actor.role === UserRole.TETENTWONER
        ? {
            $or: [{ ownerUserId: actor.id }, { requesterUserId: actor.id }],
          }
        : {
            $or: [{ targetUserId: actor.id }, { requesterUserId: actor.id }],
          };

    return this.assignmentRequestModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async updateAssignmentRequestStatus(
    actor: JwtUser,
    requestId: string,
    dto: UpdateAssignmentRequestStatusDto,
  ): Promise<any> {
    const request = await this.assignmentRequestModel.findById(requestId);

    if (!request) {
      throw new BadRequestException('Assignment request not found');
    }

    if (request.status !== AssignmentRequestStatus.PENDING) {
      throw new BadRequestException('Assignment request already processed');
    }

    const canRespond =
      (request.direction === AssignmentRequestDirection.OWNER_TO_USER &&
        request.targetUserId === actor.id) ||
      (request.direction === AssignmentRequestDirection.USER_TO_OWNER &&
        request.ownerUserId === actor.id);

    if (!canRespond) {
      throw new BadRequestException('You cannot update this request');
    }

    request.status = dto.status;

    if (dto.status === AssignmentRequestStatus.ACCEPTED) {
      await this.applyAcceptedAssignmentRequest(request);
    }

    await request.save();
    return request.toObject();
  }

  async createManagedUser(
    actor: JwtUser,
    createUserDto: CreateUserDto,
  ): Promise<AuthResponse | { message: string; user: UserResponse }> {
    const targetRole = createUserDto.role ?? UserRole.GUEST;
    this.validateCreatorPermission(actor, targetRole);

    const email = this.normalizeRequiredValue(createUserDto.email, 'Email required');
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      return this.linkExistingGlobalUser(actor, {
        userId: String(existingUser._id),
        propertyIds: createUserDto.propertyIds,
      });
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const normalizedOrganizationId =
      this.resolveOrganizationId(actor, targetRole, createUserDto.organizationId);
    const ownerId = actor.role === UserRole.TETENTWONER ? actor.id : null;
    const isGlobalProfile = this.isGlobalRole(targetRole);
    const ownerIds = ownerId ? [ownerId] : [];
    const propertyIds = this.normalizePropertyIds(targetRole, createUserDto.propertyIds);

    const user = await this.userModel.create({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: targetRole,
      organizationId: normalizedOrganizationId,
      organizationIds: normalizedOrganizationId ? [normalizedOrganizationId] : [],
      createdByUserId: actor.id,
      createdByRole: actor.role,
      firstAddedByOwnerId: ownerId,
      ownerIds,
      activeOwnerId: ownerIds[0] ?? null,
      propertyIds,
      activePropertyId: propertyIds[0] ?? null,
      isGlobalProfile,
      subscriptionTier:
        targetRole === UserRole.TETENTWONER ? OwnerSubscriptionTier.STARTER : null,
      subscriptionRequired: targetRole === UserRole.TETENTWONER,
      subscriptionActive: false,
      subscriptionStartsAt: null,
      subscriptionEndsAt: null,
      status: UserStatus.ACTIVE,
    });

    return this.buildAuthResponse(user, true);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeRequiredValue(loginDto.email, 'Email required');
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matched = await bcrypt.compare(loginDto.password, user.password);

    if (!matched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account suspended');
    }

    await this.ensureOwnerOrganization(user);
    user.lastLoginAt = new Date();
    await user.save();

    return this.buildAuthResponse(user, true);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    const user = await this.userModel
      .findById(dto.userId)
      .select('+refreshToken');

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const refreshSecret = process.env.REFRESH_TOKEN;

    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret missing');
    }

    try {
      await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const matched = await bcrypt.compare(dto.refreshToken, user.refreshToken);

    if (!matched) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    return this.buildAuthResponse(user, true);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUser(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.userModel.find().sort({ createdAt: -1 }).lean();
    return users.map((user) => this.mapUser(user));
  }

  async findAllForActor(actor: JwtUser): Promise<UserResponse[]> {
    let filter = {};

    if (actor.role === UserRole.TETENTWONER) {
      filter = {
        $or: [{ _id: actor.id }, { ownerIds: actor.id }, { createdByUserId: actor.id }],
      };
    }

    const users = await this.userModel.find(filter).sort({ createdAt: -1 }).lean();
    return users.map((user) => this.mapUser(user));
  }

  async linkExistingGlobalUser(
    actor: JwtUser,
    dto: LinkGlobalUserDto,
  ): Promise<{ message: string; user: UserResponse }> {
    const user = await this.userModel.findById(dto.userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!this.isGlobalRole(user.role)) {
      throw new BadRequestException(
        'Only worker, renter, and guest can be linked across owners/properties.',
      );
    }

    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TETENTWONER].includes(actor.role)) {
      throw new BadRequestException('You cannot link this user');
    }

    if (actor.role === UserRole.TETENTWONER) {
      if (!user.firstAddedByOwnerId) {
        throw new BadRequestException(
          'This user must first be created by a tenant owner.',
        );
      }

      this.applyOwnerAssignmentRules(user, actor.id);
    }

    const orgId = actor.organizationId ?? null;
    if (orgId && !user.organizationIds.includes(orgId)) {
      user.organizationIds.push(orgId);
    }

    if (!user.organizationId && orgId) {
      user.organizationId = orgId;
    }

    this.applyPropertyAssignmentRules(user, dto.propertyIds ?? []);

    user.isGlobalProfile = true;
    await user.save();

    return {
      message: 'Global user linked successfully',
      user: this.mapUser(user as unknown as UserRecord),
    };
  }

  private async buildAuthResponse(
    user: AuthPayloadUser,
    storeRefreshToken: boolean,
  ): Promise<AuthResponse> {
    const payload = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? null,
      status: user.status,
    };

    const access_token = this.jwtService.sign(payload);
    const refreshSecret = process.env.REFRESH_TOKEN ?? 'change-this-refresh-secret';
    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    if (storeRefreshToken) {
      const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
      await this.userModel.findByIdAndUpdate(String(user._id), {
        $set: {
          refreshToken: hashedRefreshToken,
        },
      });
    }

    return {
      access_token,
      refresh_token,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        organizationId: user.organizationId ?? null,
        organizationIds: user.organizationIds ?? [],
        jobTitle: user.jobTitle ?? null,
        avatarUrl: user.avatarUrl ?? null,
        createdByUserId: user.createdByUserId ?? null,
        createdByRole: user.createdByRole ?? null,
        firstAddedByOwnerId: user.firstAddedByOwnerId ?? null,
        ownerIds: user.ownerIds ?? [],
        activeOwnerId: user.activeOwnerId ?? null,
        propertyIds: user.propertyIds ?? [],
        activePropertyId: user.activePropertyId ?? null,
        isGlobalProfile: user.isGlobalProfile ?? false,
        subscriptionTier: user.subscriptionTier ?? null,
        subscriptionRequired: user.subscriptionRequired ?? false,
        subscriptionActive: user.subscriptionActive ?? false,
        subscriptionStartsAt: user.subscriptionStartsAt ?? null,
        subscriptionEndsAt: user.subscriptionEndsAt ?? null,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt ?? null,
      },
    };
  }

  private mapUser(user: UserRecord): UserResponse {
    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      organizationId: user.organizationId ?? null,
      organizationIds: user.organizationIds ?? [],
      jobTitle: user.jobTitle ?? null,
      avatarUrl: user.avatarUrl ?? null,
      createdByUserId: user.createdByUserId ?? null,
      createdByRole: user.createdByRole ?? null,
      firstAddedByOwnerId: user.firstAddedByOwnerId ?? null,
      ownerIds: user.ownerIds ?? [],
      activeOwnerId: user.activeOwnerId ?? null,
      propertyIds: user.propertyIds ?? [],
      activePropertyId: user.activePropertyId ?? null,
      isGlobalProfile: user.isGlobalProfile ?? false,
      subscriptionTier: user.subscriptionTier ?? null,
      subscriptionRequired: user.subscriptionRequired ?? false,
      subscriptionActive: user.subscriptionActive ?? false,
      subscriptionStartsAt: user.subscriptionStartsAt ?? null,
      subscriptionEndsAt: user.subscriptionEndsAt ?? null,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private validateCreatorPermission(actor: JwtUser, targetRole: UserRole) {
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)) {
      if (targetRole !== UserRole.TETENTWONER) {
        throw new BadRequestException(
          'Admin can add only tenant owner/property owner users.',
        );
      }

      return;
    }

    if (actor.role === UserRole.TETENTWONER) {
      if (![UserRole.WORKER, UserRole.RENTER, UserRole.GUEST].includes(targetRole)) {
        throw new BadRequestException(
          'Tenant owner can add only worker, renter, or guest.',
        );
      }

      return;
    }

    throw new BadRequestException('You cannot create users');
  }

  private resolveOrganizationId(
    actor: JwtUser,
    targetRole: UserRole,
    requestedOrganizationId?: string,
  ): string | null {
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(actor.role)) {
      return requestedOrganizationId ?? actor.organizationId ?? null;
    }

    if (actor.role === UserRole.TETENTWONER && this.isGlobalRole(targetRole)) {
      return actor.organizationId ?? null;
    }

    return requestedOrganizationId ?? null;
  }

  private isGlobalRole(role: UserRole): boolean {
    return [UserRole.WORKER, UserRole.RENTER, UserRole.GUEST].includes(role);
  }

  private normalizePropertyIds(role: UserRole, propertyIds?: string[]): string[] {
    const values = [...new Set(propertyIds ?? [])];
    if ([UserRole.RENTER, UserRole.GUEST].includes(role)) {
      return values.slice(0, 1);
    }
    return values;
  }

  private applyOwnerAssignmentRules(user: UserDocument, ownerId: string) {
    if (user.role === UserRole.WORKER) {
      if (!user.ownerIds.includes(ownerId)) {
        user.ownerIds.push(ownerId);
      }
      user.activeOwnerId = ownerId;
      return;
    }

    if ([UserRole.RENTER, UserRole.GUEST].includes(user.role)) {
      user.ownerIds = [ownerId];
      user.activeOwnerId = ownerId;
      return;
    }
  }

  private applyPropertyAssignmentRules(user: UserDocument, propertyIds: string[]) {
    if (user.role === UserRole.WORKER) {
      for (const propertyId of propertyIds) {
        if (!user.propertyIds.includes(propertyId)) {
          user.propertyIds.push(propertyId);
        }
      }
      if (propertyIds[0]) {
        user.activePropertyId = propertyIds[0];
      }
      return;
    }

    if ([UserRole.RENTER, UserRole.GUEST].includes(user.role)) {
      user.propertyIds = propertyIds.slice(0, 1);
      user.activePropertyId = user.propertyIds[0] ?? null;
      return;
    }
  }

  private normalizeRequiredValue(value?: string, message = 'Value required'): string {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      throw new BadRequestException(message);
    }

    return normalizedValue;
  }

  private validateAssignmentRequest(
    actor: JwtUser,
    dto: CreateAssignmentRequestDto,
  ) {
    if (dto.direction === AssignmentRequestDirection.OWNER_TO_USER) {
      if (actor.role !== UserRole.TETENTWONER) {
        throw new BadRequestException('Only tenant owner can send owner-to-user request');
      }
      if (!dto.targetUserId) {
        throw new BadRequestException('Target user required');
      }
      return;
    }

    if (!dto.ownerUserId) {
      throw new BadRequestException('Owner user required');
    }

    if (![UserRole.WORKER, UserRole.RENTER, UserRole.GUEST].includes(actor.role)) {
      throw new BadRequestException('Only worker, renter, or guest can request owner assignment');
    }
  }

  private async applyAcceptedAssignmentRequest(
    request: AssignmentRequestDocument,
  ): Promise<void> {
    const userId =
      request.direction === AssignmentRequestDirection.OWNER_TO_USER
        ? request.targetUserId
        : request.requesterUserId;

    const ownerId =
      request.direction === AssignmentRequestDirection.OWNER_TO_USER
        ? request.ownerUserId
        : request.ownerUserId;

    if (!userId || !ownerId) {
      throw new BadRequestException('Invalid assignment request');
    }

    const owner = await this.userModel.findById(ownerId).lean();
    if (!owner || owner.role !== UserRole.TETENTWONER) {
      throw new BadRequestException('Owner not found');
    }

    await this.linkExistingGlobalUser(
      {
        id: String(owner._id),
        email: owner.email,
        role: owner.role,
        organizationId: owner.organizationId ?? null,
        status: owner.status,
      },
      {
        userId,
        propertyIds: request.propertyIds ?? [],
      },
    );
  }

  private async createOwnerOrganization(user: UserDocument): Promise<string> {
    const organizationName = `${user.fullName} Properties`;
    const organization = await this.organizationModel.create({
      name: organizationName,
      slug: await this.generateUniqueOrganizationSlug(organizationName),
      email: user.email,
      phone: user.phoneNumber,
      description: `${user.fullName} owner workspace`,
      ownerId: String(user._id),
    });

    return String(organization._id);
  }

  private async ensureOwnerOrganization(user: UserDocument): Promise<void> {
    if (user.role !== UserRole.TETENTWONER || user.organizationId) {
      return;
    }

    const organizationId = await this.createOwnerOrganization(user);
    user.organizationId = organizationId;
    user.organizationIds = [organizationId];
  }

  private async generateUniqueOrganizationSlug(value: string): Promise<string> {
    const baseSlug =
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'owner-org';

    let slug = baseSlug;
    let counter = 1;

    while (await this.organizationModel.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }
}
