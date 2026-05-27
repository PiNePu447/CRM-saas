import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: { url: PrismaService.buildConnectionUrl(process.env.DATABASE_URL) },
      },
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  /**
   * Automatically appends pgbouncer=true and connection_limit=1 when the URL
   * targets a Supabase/PgBouncer pooler (port 6543 or *.pooler.supabase.com).
   * This prevents the "prepared statement does not exist" error (PostgreSQL code 26000)
   * caused by PgBouncer transaction mode not preserving prepared statements across connections.
   */
  private static buildConnectionUrl(url: string | undefined): string | undefined {
    if (!url) return url;

    const isPooler = url.includes(':6543/') || url.includes('pooler.supabase.com');
    if (isPooler && !url.includes('pgbouncer=true')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}pgbouncer=true&connection_limit=1`;
    }

    return url;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.$on as any)('query', (e: { query: string; duration: number }) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async softDelete<T>(
    model: { update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<T> },
    id: string,
  ): Promise<T> {
    return model.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
