import { NextRequest, NextResponse } from 'next/server';
import { testOracleConnection, validateWOWLID } from '@/lib/oracle-config';

export async function POST(request: NextRequest) {
  try {
    const { woWlid } = await request.json();

    if (!woWlid) {
      return NextResponse.json(
        { error: 'WO_WLID is required' },
        { status: 400 }
      );
    }

    // Test database connection first
    const connectionTest = await testOracleConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please contact the administrator.',
          details: connectionTest.error 
        },
        { status: 503 }
      );
    }

    // Validate WO_WLID
    const validation = await validateWOWLID(woWlid);
    if (validation.error) {
      return NextResponse.json(
        { 
          error: 'Database validation failed. Please contact the administrator.',
          details: validation.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: validation.exists,
      woWlid: woWlid
    });

  } catch (error: any) {
    console.error('API validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please contact the administrator.' },
      { status: 500 }
    );
  }
}