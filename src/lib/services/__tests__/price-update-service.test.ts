import { PriceUpdateService } from '../price-update-service';
import * as PokemonTcgApi from '../pokemon-tcg-api';

// Mock dependencies
jest.mock('../supabase-server', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  })
}));

jest.mock('../pokemon-tcg-api');

describe('PriceUpdateService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };

    // Reset the PriceUpdateService's state for each test
    // This is a workaround since the service uses static methods and properties
    // @ts-ignore: Accessing private property for testing
    PriceUpdateService.updateQueue = [];
    // @ts-ignore: Accessing private property for testing
    PriceUpdateService.isProcessing = false;
  });

  describe('updatePricesByTier', () => {
    it('should update prices for cards in the specified tier', async () => {
      // Mock data
      const mockCards = [
        { id: 'card-1', name: 'Card 1', set_id: 'set-1', tcg_price: 75, price_updated_at: '2023-01-01' },
        { id: 'card-2', name: 'Card 2', set_id: 'set-1', tcg_price: 55, price_updated_at: '2023-01-02' }
      ];
      
      // Mock API response
      (PokemonTcgApi.getCardById as jest.Mock).mockImplementation((cardId) => {
        return Promise.resolve({
          data: {
            id: cardId,
            name: cardId === 'card-1' ? 'Card 1' : 'Card 2',
            tcgplayer: {
              prices: {
                normal: {
                  market: cardId === 'card-1' ? 80 : 60
                }
              }
            }
          }
        });
      });
      
      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        data: mockCards,
        error: null
      });
      
      mockSupabase.update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null
        })
      });
      
      const result = await PriceUpdateService.updatePricesByTier('high', 10, mockSupabase);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('cards');
      expect(mockSupabase.gt).toHaveBeenCalledWith('tcg_price', 50);
      expect(PokemonTcgApi.getCardById).toHaveBeenCalledTimes(2);
      
      expect(result.cardsProcessed).toBe(2);
      expect(result.successfulUpdates).toBe(2);
      expect(result.failedUpdates).toBe(0);
      expect(result.results.length).toBe(2);
      
      // Check that prices were updated
      expect(result.results[0].newPrice).toBe(80);
      expect(result.results[0].oldPrice).toBe(75);
      expect(result.results[1].newPrice).toBe(60);
      expect(result.results[1].oldPrice).toBe(55);
    });
    
    it('should handle API errors when updating prices', async () => {
      // Mock data
      const mockCards = [
        { id: 'card-1', name: 'Card 1', set_id: 'set-1', tcg_price: 75, price_updated_at: '2023-01-01' }
      ];
      
      // Mock API error
      (PokemonTcgApi.getCardById as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        data: mockCards,
        error: null
      });
      
      const result = await PriceUpdateService.updatePricesByTier('high', 10, mockSupabase);
      
      expect(result.cardsProcessed).toBe(1);
      expect(result.successfulUpdates).toBe(0);
      expect(result.failedUpdates).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });
  });

  describe('scheduleUpdates', () => {
    it('should schedule price updates for all cards', async () => {
      // Mock data
      const mockCards = [
        { id: 'card-1', name: 'Card 1', set_id: 'set-1', tcg_price: 75, price_updated_at: '2023-01-01' },
        { id: 'card-2', name: 'Card 2', set_id: 'set-1', tcg_price: 30, price_updated_at: '2023-01-02' },
        { id: 'card-3', name: 'Card 3', set_id: 'set-1', tcg_price: 5, price_updated_at: '2023-01-03' }
      ];
      
      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: mockCards,
        error: null
      });
      
      const result = await PriceUpdateService.scheduleUpdates(mockSupabase);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('cards');
      expect(mockSupabase.order).toHaveBeenCalled();
      
      // Check queue stats
      expect(result.queueStats.queuedItems).toBe(3);
      expect(result.queueStats.highPriorityItems).toBe(1); // Card with price 75
      expect(result.queueStats.mediumPriorityItems).toBe(1); // Card with price 30
      expect(result.queueStats.lowPriorityItems).toBe(1); // Card with price 5
      expect(result.queueStats.estimatedTimeToComplete).toBeGreaterThan(0);
    });
    
    it('should handle errors when scheduling updates', async () => {
      // Mock Supabase error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: null,
        error: new Error('Database error')
      });
      
      await expect(PriceUpdateService.scheduleUpdates(mockSupabase)).rejects.toThrow('Database error');
    });
  });

  describe('getQueueStats', () => {
    it('should return accurate queue statistics', async () => {
      // Setup a test queue
      const highPriorityCard = {
        cardId: 'card-1',
        cardName: 'Card 1',
        setId: 'set-1',
        priority: 'high' as const,
        currentPrice: 75,
        lastUpdated: '2023-01-01'
      };
      
      const mediumPriorityCard = {
        cardId: 'card-2',
        cardName: 'Card 2',
        setId: 'set-1',
        priority: 'medium' as const,
        currentPrice: 30,
        lastUpdated: '2023-01-02'
      };
      
      const lowPriorityCard = {
        cardId: 'card-3',
        cardName: 'Card 3',
        setId: 'set-1',
        priority: 'low' as const,
        currentPrice: 5,
        lastUpdated: '2023-01-03'
      };
      
      // @ts-ignore: Accessing private property for testing
      PriceUpdateService.updateQueue = [highPriorityCard, mediumPriorityCard, lowPriorityCard];
      
      const stats = PriceUpdateService.getQueueStats();
      
      expect(stats.queuedItems).toBe(3);
      expect(stats.highPriorityItems).toBe(1);
      expect(stats.mediumPriorityItems).toBe(1);
      expect(stats.lowPriorityItems).toBe(1);
      expect(stats.estimatedTimeToComplete).toBeGreaterThan(0);
    });
  });
}); 