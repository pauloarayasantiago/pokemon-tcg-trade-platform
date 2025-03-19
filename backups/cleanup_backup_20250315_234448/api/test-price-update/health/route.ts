import { NextResponse } from 'next/server';
import { PriceUpdateService } from '@/lib/services/price-update-service';

export async function GET() {
  try {
    // Get price update stats
    const stats = await PriceUpdateService.getPriceUpdateStats();
    const queueStats = PriceUpdateService.getQueueStats();
    
    return NextResponse.json({
      status: 'success',
      message: 'Price Update Service is operational',
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        queue: queueStats
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Price Update Service health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 