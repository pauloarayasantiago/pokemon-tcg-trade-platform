import { NextResponse } from 'next/server';
import { DataValidator } from '@/lib/utils/data-validator';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('data-validation');

/**
 * GET handler for data validation endpoint
 * Parameters:
 * - setId (optional): Validate a specific set only
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    logger.info(`Starting data validation${setId ? ` for set ${setId}` : ' for all data'}`);

    let validationResult;
    if (setId) {
      // Validate a specific set
      validationResult = await DataValidator.validateSet(setId);
    } else {
      // Validate all card data
      validationResult = await DataValidator.validateCardData();
    }

    logger.info('Data validation completed successfully');
    
    return NextResponse.json({
      status: 'success',
      setId: setId || null,
      timestamp: new Date().toISOString(),
      results: validationResult
    });
  } catch (error: any) {
    logger.error(`Data validation failed: ${error.message}`, error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Data validation failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 