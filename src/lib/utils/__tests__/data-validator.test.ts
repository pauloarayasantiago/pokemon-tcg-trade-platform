import { DataValidator } from '../data-validator';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  })
}));

describe('DataValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCardData', () => {
    it('should validate all card data and return statistics', async () => {
      // Setup mock responses
      const mockSets = [
        { 
          id: 'set1', 
          name: 'Test Set 1', 
          release_date: '2023-01-01',
          total_cards: 10,
          cards: [{ count: 8 }]
        },
        { 
          id: 'set2', 
          name: 'Test Set 2', 
          release_date: '2023-02-01',
          total_cards: 5,
          cards: [{ count: 0 }]
        }
      ];
      
      const mockCards = [
        {
          id: 'card1',
          name: 'Test Card 1',
          set_id: 'set1',
          tcg_price: 10.00,
          price_updated_at: '2023-01-10T00:00:00Z',
          image_small: 'image1-small.jpg',
          image_large: 'image1-large.jpg'
        },
        {
          id: 'card2',
          name: 'Test Card 2',
          set_id: 'set1',
          tcg_price: null,
          price_updated_at: null,
          image_small: 'image2-small.jpg',
          image_large: 'image2-large.jpg'
        },
        {
          id: 'card3',
          name: 'Test Card 3',
          set_id: 'set1',
          tcg_price: 5.00,
          price_updated_at: '2023-01-15T00:00:00Z',
          image_small: null,
          image_large: null
        }
      ];
      
      // Mock the Supabase responses
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      
      jest.spyOn(mockSupabase, 'select')
        .mockImplementationOnce(() => ({ // First call for sets
          data: mockSets,
          error: null
        }))
        .mockImplementationOnce(() => ({ // Second call for cards
          data: mockCards,
          error: null
        }));
      
      // Execute validation
      const result = await DataValidator.validateCardData();
      
      // Verify the result
      expect(result.isValid).toBe(true);
      expect(result.stats.totalSets).toBe(2);
      expect(result.stats.totalCards).toBe(3);
      expect(result.stats.setsWithoutCards).toBe(1);
      expect(result.stats.cardsWithoutPrices).toBe(1);
      expect(result.stats.cardsWithoutImages).toBe(1);
      
      // Verify warnings
      expect(result.warnings.length).toBe(3);
      expect(result.warnings.find(w => w.type === 'SETS_WITHOUT_CARDS')).toBeDefined();
      expect(result.warnings.find(w => w.type === 'CARDS_WITHOUT_PRICES')).toBeDefined();
      expect(result.warnings.find(w => w.type === 'CARDS_WITHOUT_IMAGES')).toBeDefined();
      
      // Verify no errors
      expect(result.errors.length).toBe(0);
    });

    it('should handle database errors', async () => {
      // Mock a database error
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      
      jest.spyOn(mockSupabase, 'select')
        .mockImplementationOnce(() => ({
          data: null,
          error: new Error('Database connection error')
        }));
      
      // Execute validation
      const result = await DataValidator.validateCardData();
      
      // Verify the result
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].type).toBe('VALIDATION_FAILED');
      expect(result.errors[0].message).toContain('Database connection error');
    });
  });

  describe('validateSet', () => {
    it('should validate a specific set and return statistics', async () => {
      // Setup mock responses
      const mockSet = { 
        id: 'set1', 
        name: 'Test Set 1', 
        release_date: '2023-01-01',
        total_cards: 10
      };
      
      const mockCards = [
        {
          id: 'card1',
          name: 'Test Card 1',
          set_id: 'set1',
          tcg_price: 10.00,
          price_updated_at: '2023-01-10T00:00:00Z',
          image_small: 'image1-small.jpg',
          image_large: 'image1-large.jpg'
        },
        {
          id: 'card2',
          name: 'Test Card 2',
          set_id: 'set1',
          tcg_price: null,
          price_updated_at: null,
          image_small: 'image2-small.jpg',
          image_large: 'image2-large.jpg'
        }
      ];
      
      // Mock the Supabase responses
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      
      jest.spyOn(mockSupabase, 'single')
        .mockReturnValue({
          data: mockSet,
          error: null
        });
        
      jest.spyOn(mockSupabase, 'eq')
        .mockImplementationOnce(() => ({ // First call for set
          single: jest.fn().mockReturnValue({
            data: mockSet,
            error: null
          })
        }))
        .mockImplementationOnce(() => ({ // Second call for cards
          data: mockCards,
          error: null
        }));
      
      // Execute validation
      const result = await DataValidator.validateSet('set1');
      
      // Verify the result
      expect(result.isValid).toBe(true);
      expect(result.stats.totalSets).toBe(1);
      expect(result.stats.totalCards).toBe(2);
      expect(result.stats.cardsWithoutPrices).toBe(1);
      
      // Verify warnings
      expect(result.warnings.length).toBe(2);
      expect(result.warnings.find(w => w.type === 'CARDS_WITHOUT_PRICES')).toBeDefined();
      expect(result.warnings.find(w => w.type === 'INCOMPLETE_SET')).toBeDefined();
      
      // Verify no errors
      expect(result.errors.length).toBe(0);
    });

    it('should handle case when set is not found', async () => {
      // Mock a set not found response
      const mockSupabase = require('@/lib/supabase-server').createServerSupabaseClient();
      
      jest.spyOn(mockSupabase, 'single')
        .mockReturnValue({
          data: null,
          error: { message: 'Not found' }
        });
      
      // Execute validation
      const result = await DataValidator.validateSet('nonexistent');
      
      // Verify the result
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].type).toBe('VALIDATION_FAILED');
    });
  });
}); 