import { NextResponse } from 'next/server';
import { prisma, testDatabaseConnection, getDatabaseInfo } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'error', 
          database: 'disconnected',
          message: 'Database connection test failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    // Get database info
    const dbInfo = await getDatabaseInfo();
    
    return NextResponse.json(
      { 
        status: 'ok', 
        database: 'connected',
        databaseInfo: dbInfo,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        database: 'disconnected',
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
