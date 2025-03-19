import { NextResponse } from 'next/server';
import { PriceUpdateService } from '@/lib/services/price-update-service';

export async function GET() {
  try {
    const queueStats = PriceUpdateService.getQueueStats();
    const priceStats = await PriceUpdateService.getPriceUpdateStats();
    
    return NextResponse.json({
      status: 'success',
      queueStats: {
        ...queueStats,
        priceStats
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Failed to get queue statistics',
      queueStats: null
    }, { status: 500 });
  }
} 