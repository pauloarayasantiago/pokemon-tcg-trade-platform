import { CardSearch, CardSearchParams } from '../card-search';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue({ count: 100, error: null }),
    toURL: jest.fn().mockReturnValue({ toString: () => 'https://example.com/query' })
  })
}));

// Mock performance.now
const originalPerformanceNow = performance.now;
beforeAll(() => {
  global.performance.now = jest.fn()
    .mockReturnValueOnce(1000) // Start time
    .mockReturnValueOnce(1250); // End time (250ms later)
});

afterAll(() => {
  global.performance.now = originalPerformanceNow;
});

describe('CardSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cache before each test
    CardSearch.clearCache();
  });

  describe('searchCards', () => {
    it('should search for cards with the given parameters', async () => {
      // Setup mock response
      const mockCards = [
        { id: 'card1', name: 'Test Card 1', tcg_price: 50 },
        { id: 'card2', name: 'Test Card 2', tcg_price: 30 }
      ];
      
      // Mock the final query execution
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      jest.spyOn(mockSupabase, 'range').mockResolvedValue({
        data: mockCards,
        error: null
      });
      
      // Test parameters
      const params: CardSearchParams = {
        name: 'Test',
        setId: 'set1',
        rarity: 'Rare',
        minPrice: 10,
        maxPrice: 100,
        limit: 10,
        offset: 0,
        includeSetData: true
      };
      
      // Execute the search
      const result = await CardSearch.searchCards(params);
      
      // Verify the result
      expect(result.cards).toEqual(mockCards);
      expect(result.totalCount).toBe(100);
      expect(result.executionTimeMs).toBe(250);
      
      // Verify that the correct filters were applied
      const supabase = require('@/lib/supabase-server').createServerSupabaseClient();
      expect(supabase.from).toHaveBeenCalledWith('cards');
      expect(supabase.select).toHaveBeenCalledWith(
        'id, name, set_id, rarity, tcg_price, price_updated_at, image_small, image_large, sets:set_id(id, name, release_date, symbol_url)'
      );
      expect(supabase.ilike).toHaveBeenCalledWith('name', '%Test%');
      expect(supabase.eq).toHaveBeenCalledWith('set_id', 'set1');
      expect(supabase.eq).toHaveBeenCalledWith('rarity', 'Rare');
      expect(supabase.gte).toHaveBeenCalledWith('tcg_price', 10);
      expect(supabase.lte).toHaveBeenCalledWith('tcg_price', 100);
      expect(supabase.order).toHaveBeenCalledWith('tcg_price', { ascending: false });
      expect(supabase.limit).toHaveBeenCalledWith(10);
      expect(supabase.range).toHaveBeenCalledWith(0, 9);
    });
    
    it('should use cache for repeated searches with the same parameters', async () => {
      // Setup mock response
      const mockCards = [
        { id: 'card1', name: 'Test Card 1', tcg_price: 50 }
      ];
      
      // Mock the query execution
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      jest.spyOn(mockSupabase, 'range').mockResolvedValue({
        data: mockCards,
        error: null
      });
      
      // Test parameters
      const params: CardSearchParams = {
        name: 'Test',
        limit: 10
      };
      
      // Execute the search
      await CardSearch.searchCards(params);
      
      // Execute the same search again
      await CardSearch.searchCards(params);
      
      // The supabase client should only be called once for the first search
      // The second search should use the cached result
      const supabase = require('@/lib/supabase-server').createServerSupabaseClient();
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during search', async () => {
      // Mock an error response
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      jest.spyOn(mockSupabase, 'count').mockResolvedValue({
        count: null,
        error: new Error('Database error')
      });
      
      // Test parameters
      const params: CardSearchParams = {
        name: 'Test'
      };
      
      // Execute the search and expect it to throw
      await expect(CardSearch.searchCards(params)).rejects.toThrow('Database error');
    });
  });

  describe('clearCache', () => {
    it('should clear the search cache', async () => {
      // Setup mock response
      const mockCards = [
        { id: 'card1', name: 'Test Card 1', tcg_price: 50 }
      ];
      
      // Mock the query execution
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      jest.spyOn(mockSupabase, 'range').mockResolvedValue({
        data: mockCards,
        error: null
      });
      
      // Test parameters
      const params: CardSearchParams = {
        name: 'Test'
      };
      
      // Execute the search to populate the cache
      await CardSearch.searchCards(params);
      
      // Clear the cache
      CardSearch.clearCache();
      
      // Execute the same search again
      await CardSearch.searchCards(params);
      
      // The supabase client should be called twice
      // Once for the first search and once for the second search after clearing the cache
      const supabase = require('@/lib/supabase-server').createServerSupabaseClient();
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });
}); 