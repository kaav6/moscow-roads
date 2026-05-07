import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('invalid-credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid-credentials');

    const roles = user.roles.map(r => r.roleId);
    const payload = { sub: user.id, email: user.email, roles, shift: user.shift };
    const accessToken = await this.jwt.signAsync(payload);
    const decoded = this.jwt.decode(accessToken) as any;
    const expiresAt = new Date((decoded?.exp ?? 0) * 1000).toISOString();
    return {
      user: this.serialize(user, roles),
      accessToken,
      expiresAt,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('invalid-token');
    return { user: this.serialize(user, user.roles.map(r => r.roleId)) };
  }

  private serialize(user: { id: string; email: string; fullName: string; shift: string | null; createdAt: Date }, roles: string[]) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      shift: user.shift,
      roles,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
