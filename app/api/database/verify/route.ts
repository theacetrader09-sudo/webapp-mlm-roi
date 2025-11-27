import { NextResponse } from 'next/server';
import { testDatabaseConnection, getDatabaseInfo } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test connection
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        {
          status: 'error',
          connected: false,
          message: 'Database connection test failed',
        },
        { status: 500 }
      );
    }
    
    // Get detailed database info
    const dbInfo = await getDatabaseInfo();
    
    // Check if using local database
    const isLocal = dbInfo.isLocal || false;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isLocal && isProduction) {
      return NextResponse.json(
        {
          status: 'error',
          connected: true,
          warning: 'CRITICAL: Production environment is using localhost database!',
          databaseInfo: dbInfo,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'ok',
        connected: true,
        message: 'Database connection verified',
        databaseInfo: dbInfo,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Database verification failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        connected: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

