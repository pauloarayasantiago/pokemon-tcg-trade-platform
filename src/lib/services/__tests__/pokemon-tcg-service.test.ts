import { PokemonTcgService } from '../pokemon-tcg-service';
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
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    data: null,
    error: null,
    count: 0
  })
}));

jest.mock('../pokemon-tcg-api');

describe('PokemonTcgService', () => {
  let service: PokemonTcgService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis()
    };
    
    service = new PokemonTcgService(mockSupabase);
  });

  describe('syncAllSets', () => {
    it('should sync all sets and return statistics', async () => {
      // Mock static method implementation
      const originalSyncSets = PokemonTcgService.syncSets;
      PokemonTcgService.syncSets = jest.fn().mockResolvedValue(undefined);
      
      // Mock supabase response for set count
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: 'exact',
          head: true,
          data: null,
          error: null,
          count: 10
        })
      });
      
      const result = await service.syncAllSets();
      
      expect(PokemonTcgService.syncSets).toHaveBeenCalledWith(mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledWith('sets');
      expect(result).toEqual({
        totalSets: 10,
        syncedAt: expect.any(String),
        success: true
      });
      
      // Restore original method
      PokemonTcgService.syncSets = originalSyncSets;
    });
    
    it('should handle errors during sync', async () => {
      // Mock static method implementation to throw error
      const originalSyncSets = PokemonTcgService.syncSets;
      PokemonTcgService.syncSets = jest.fn().mockRejectedValue(new Error('API error'));
      
      await expect(service.syncAllSets()).rejects.toThrow('API error');
      
      // Restore original method
      PokemonTcgService.syncSets = originalSyncSets;
    });
  });
  
  describe('getAllSets', () => {
    it('should return all sets from database', async () => {
      const mockSets = [
        { id: 'sv1', name: 'Scarlet & Violet', release_date: '2023-01-01' },
        { id: 'swsh12', name: 'Silver Tempest', release_date: '2022-11-01' }
      ];
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: mockSets,
            error: null
          })
        })
      });
      
      const result = await service.getAllSets();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('sets');
      expect(result).toEqual(mockSets);
    });
    
    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: null,
            error: new Error('Database error')
          })
        })
      });
      
      await expect(service.getAllSets()).rejects.toThrow('Database error');
    });
  });
  
  describe('syncCardsForSet', () => {
    it('should sync cards for a specific set and return statistics', async () => {
      // Mock static method implementation
      const originalSyncCardsBySet = PokemonTcgService.syncCardsBySet;
      PokemonTcgService.syncCardsBySet = jest.fn().mockResolvedValue(undefined);
      
      // Mock supabase responses
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'cards') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: 'exact',
                head: true,
                data: null,
                error: null,
                count: 150
              })
            })
          };
        } else if (tableName === 'card_variations') {
          return {
            select: jest.fn().mockReturnValue({
              like: jest.fn().mockReturnValue({
                count: 'exact',
                head: true,
                data: null,
                error: null,
                count: 75
              })
            })
          };
        }
        return mockSupabase;
      });
      
      const result = await service.syncCardsForSet('sv1');
      
      expect(PokemonTcgService.syncCardsBySet).toHaveBeenCalledWith('sv1', mockSupabase);
      expect(mockSupabase.from).toHaveBeenCalledWith('cards');
      expect(mockSupabase.from).toHaveBeenCalledWith('card_variations');
      expect(result).toEqual({
        setId: 'sv1',
        totalCards: 150,
        totalVariations: 75,
        syncedAt: expect.any(String),
        success: true
      });
      
      // Restore original method
      PokemonTcgService.syncCardsBySet = originalSyncCardsBySet;
    });
    
    it('should handle errors and return failed result', async () => {
      // Mock static method implementation to throw error
      const originalSyncCardsBySet = PokemonTcgService.syncCardsBySet;
      PokemonTcgService.syncCardsBySet = jest.fn().mockRejectedValue(new Error('API error'));
      
      const result = await service.syncCardsForSet('sv1');
      
      expect(result).toEqual({
        setId: 'sv1',
        totalCards: 0,
        totalVariations: 0,
        syncedAt: expect.any(String),
        success: false
      });
      
      // Restore original method
      PokemonTcgService.syncCardsBySet = originalSyncCardsBySet;
    });
  });
}); 