import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Verify DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  throw new Error('DATABASE_URL environment variable is required');
}

// Check if using local database (for safety)
const isLocalDatabase = databaseUrl.includes('localhost') || 
                        databaseUrl.includes('127.0.0.1') || 
                        databaseUrl.includes('postgresql://localhost') ||
                        databaseUrl.includes('postgresql://127.0.0.1');

if (isLocalDatabase && process.env.NODE_ENV === 'production') {
  console.error('❌ WARNING: Production environment is using localhost database!');
  console.error('DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
}

// Log database connection info (without sensitive data)
const dbUrlInfo = databaseUrl.replace(/:[^:@]+@/, ':****@');
console.log('📊 Database Connection:', {
  url: dbUrlInfo,
  isLocal: isLocalDatabase,
  environment: process.env.NODE_ENV || 'development',
});

// Create Prisma client with connection pooling settings
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to test database connection and verify it's not local
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Verify we're not using localhost in production
    if (process.env.NODE_ENV === 'production' && isLocalDatabase) {
      console.error('❌ CRITICAL: Production is connected to localhost database!');
      return false;
    }
    
    // Get database info to verify connection
    const result = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database();
    `;
    
    if (result && result.length > 0) {
      console.log('✅ Database connected:', result[0].current_database);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return false;
  }
}

// Helper function to get database connection info (for diagnostics)
export async function getDatabaseInfo() {
  try {
    const [dbInfo, userInfo, versionInfo] = await Promise.all([
      prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`,
      prisma.$queryRaw<Array<{ current_user: string }>>`SELECT current_user;`,
      prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`,
    ]);
    
    const safeUrl = databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':****@') : 'not-set';
    
    return {
      database: dbInfo[0]?.current_database || 'unknown',
      user: userInfo[0]?.current_user || 'unknown',
      version: versionInfo[0]?.version || 'unknown',
      url: safeUrl,
      isLocal: isLocalDatabase,
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    const safeUrl = databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':****@') : 'not-set';
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: safeUrl,
      isLocal: isLocalDatabase,
    };
  }
}

// Handle connection on startup (non-blocking)
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database');
    // Verify connection in production
    if (process.env.NODE_ENV === 'production') {
      testDatabaseConnection().then(isConnected => {
        if (!isConnected) {
          console.error('❌ CRITICAL: Database connection verification failed in production!');
        }
      });
    }
  })
  .catch((error) => {
    console.error('❌ Prisma connection error on startup:', error);
  });

