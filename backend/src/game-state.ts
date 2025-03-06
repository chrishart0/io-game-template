// Manages the game state for the shrimp survival game
// Including shrimp players and food items that shrimp can eat to grow

// Interface for shrimp players
export interface Shrimp {
  id: string;      // Unique player identifier
  x: number;       // X position on the map
  y: number;       // Y position on the map
  size: number;    // Size of the shrimp (grows as it eats)
}

// Interface for food items
export interface Food {
  x: number;       // X position on the map
  y: number;       // Y position on the map
  size: number;    // Size of the food item
}

// Game configuration
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const INITIAL_SHRIMP_SIZE = 10;
const FOOD_SIZE = 5;
const INITIAL_FOOD_COUNT = 10;

// Game state storage
const shrimps: Map<string, Shrimp> = new Map();
const foods: Food[] = [];

/**
 * Generates a random position within the map boundaries
 */
function getRandomPosition() {
  return {
    x: Math.floor(Math.random() * MAP_WIDTH),
    y: Math.floor(Math.random() * MAP_HEIGHT)
  };
}

/**
 * Add a new shrimp when a player connects
 * @param id The socket ID of the connecting player
 */
export function addShrimp(id: string): Shrimp {
  // Create a new shrimp with random position and initial size
  const position = getRandomPosition();
  const newShrimp: Shrimp = {
    id,
    x: position.x,
    y: position.y,
    size: INITIAL_SHRIMP_SIZE
  };
  
  // Store the shrimp in the map
  shrimps.set(id, newShrimp);
  console.log(`Shrimp added: ${id} at position (${newShrimp.x}, ${newShrimp.y})`);
  
  return newShrimp;
}

/**
 * Remove a shrimp when a player disconnects
 * @param id The socket ID of the disconnecting player
 */
export function removeShrimp(id: string): boolean {
  const removed = shrimps.delete(id);
  if (removed) {
    console.log(`Shrimp removed: ${id}`);
  }
  return removed;
}

/**
 * Update a shrimp's position based on player input
 * @param id The socket ID of the player
 * @param x The new X position
 * @param y The new Y position
 */
export function updateShrimpPosition(id: string, x: number, y: number): Shrimp | null {
  const shrimp = shrimps.get(id);
  if (!shrimp) return null;
  
  // Update the shrimp's position
  shrimp.x = Math.max(0, Math.min(MAP_WIDTH, x));
  shrimp.y = Math.max(0, Math.min(MAP_HEIGHT, y));
  
  // Update the shrimp in the map
  shrimps.set(id, shrimp);
  return shrimp;
}

/**
 * Spawn food items randomly on the map
 * @param count Number of food items to spawn
 */
export function spawnFood(count: number = INITIAL_FOOD_COUNT): void {
  for (let i = 0; i < count; i++) {
    const position = getRandomPosition();
    foods.push({
      x: position.x,
      y: position.y,
      size: FOOD_SIZE
    });
  }
  console.log(`Spawned ${count} food items`);
}

/**
 * Check if a shrimp can eat food and grow
 * Updates shrimp size and removes eaten food
 */
export function processEating(): void {
  shrimps.forEach(shrimp => {
    // Check for food collisions
    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i];
      // Calculate distance between shrimp and food
      const dx = shrimp.x - food.x;
      const dy = shrimp.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If the distance is less than the sum of their sizes, collision occurred
      if (distance < shrimp.size + food.size) {
        // Increase shrimp size (grow)
        shrimp.size += 1;
        
        // Remove the eaten food
        foods.splice(i, 1);
        
        console.log(`Shrimp ${shrimp.id} ate food, new size: ${shrimp.size}`);
        
        // Spawn a new food to replace the eaten one
        const position = getRandomPosition();
        foods.push({
          x: position.x,
          y: position.y,
          size: FOOD_SIZE
        });
      }
    }
  });
  
  // If food count drops below initial count for any reason, spawn more
  if (foods.length < INITIAL_FOOD_COUNT) {
    spawnFood(INITIAL_FOOD_COUNT - foods.length);
  }
}

/**
 * Get the current game state
 * @returns Object containing all shrimps and foods
 */
export function getGameState() {
  return {
    shrimps: Array.from(shrimps.values()),
    foods: foods
  };
}

/**
 * Initialize the game state
 */
export function initGameState(): void {
  // Clear any existing state
  shrimps.clear();
  foods.length = 0;
  
  // Spawn initial food
  spawnFood();
  console.log('Game state initialized');
} 