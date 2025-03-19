import { NextResponse } from 'next/server';
import { DataValidator } from '@/lib/utils/data-validator';
import { Logger } from '@/lib/utils/logger';

const logger = new Logger('test-data-validation');

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
      // Validate specific set
      validationResult = await DataValidator.validateSet(setId);
      logger.info(`Validation completed for set ${setId}`);
    } else {
      // Validate all data
      validationResult = await DataValidator.validateCardData();
      logger.info('Validation completed for all data');
    }

    return NextResponse.json({
      success: validationResult.isValid,
      timestamp: new Date().toISOString(),
      setId: setId || 'all',
      stats: validationResult.stats,
      warnings: validationResult.warnings,
      errors: validationResult.errors
    });
  } catch (error: any) {
    logger.error(`Data validation failed: ${error.message}`, error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
} 