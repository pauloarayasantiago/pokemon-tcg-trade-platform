/**
 * Simple wrapper for the Pokemon TCG API
 */

const API_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMONTCG_API_KEY || '';

/**
 * Get all sets from the Pokemon TCG API
 */
export async function getAllSets() {
  const response = await fetch(`${API_URL}/sets`, {
    headers: {
      'X-Api-Key': API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sets: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get cards for a specific set from the Pokemon TCG API
 */
export async function getCardsBySet(setId: string) {
  const response = await fetch(`${API_URL}/cards?q=set.id:${setId}`, {
    headers: {
      'X-Api-Key': API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch cards for set ${setId}: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a card by ID from the Pokemon TCG API
 */
export async function getCardById(cardId: string) {
  const response = await fetch(`${API_URL}/cards/${cardId}`, {
    headers: {
      'X-Api-Key': API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch card ${cardId}: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
} 