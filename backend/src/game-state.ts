// Manages the game state for the shrimp survival game
// Including shrimp players and food items that shrimp can eat to grow

// Interface for shrimp players
export interface Shrimp {
  id: string;      // Unique player identifier
  x: number;       // X position on the map
  y: number;       // Y position on the map
  size: number;    // Size of the shrimp (grows as it eats)
  score: number;   // Player's score
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
const MAX_SHRIMP_SIZE = 50;  // Maximum size a shrimp can grow to
const INITIAL_FOOD_COUNT = 10;
const MIN_FOOD_SIZE = 4;     // Minimum food size
const MAX_FOOD_SIZE = 6;     // Maximum food size
const GROWTH_PER_FOOD = 1;   // How much a shrimp grows per food eaten
const GROWTH_PER_SHRIMP = 5; // How much a shrimp grows when eating another shrimp
const SCORE_PER_FOOD = 5;    // Score gained per food item (increased from 1)
const SCORE_PER_SHRIMP = 20; // Score gained per shrimp eaten

// Game state storage
const shrimps: Map<string, Shrimp> = new Map();
const foods: Food[] = [];

/**
 * Generates a random position within the map boundaries
 * Ensures shrimps don't spawn too close to edges
 */
function getRandomPosition() {
  // Add margin to ensure entities are visible
  const margin = 50;
  return {
    x: margin + Math.floor(Math.random() * (MAP_WIDTH - 2 * margin)),
    y: margin + Math.floor(Math.random() * (MAP_HEIGHT - 2 * margin))
  };
}

/**
 * Generates a random food size within the defined range
 */
function getRandomFoodSize() {
  return MIN_FOOD_SIZE + Math.floor(Math.random() * (MAX_FOOD_SIZE - MIN_FOOD_SIZE + 1));
}

/**
 * Add a new shrimp when a player connects
 * @param id The socket ID of the connecting player
 */
export function addShrimp(id: string): Shrimp {
  // Remove any existing shrimp with this ID to prevent duplicates
  shrimps.delete(id);
  
  // Create a new shrimp with random position and initial size
  const position = getRandomPosition();
  const newShrimp: Shrimp = {
    id,
    x: position.x,
    y: position.y,
    size: INITIAL_SHRIMP_SIZE,
    score: 0
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
  } else {
    console.warn(`Attempted to remove non-existent shrimp: ${id}`);
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
  if (!shrimp) {
    console.warn(`Tried to update position for non-existent shrimp: ${id}`);
    return null;
  }
  
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
      size: getRandomFoodSize()  // Random size between MIN and MAX
    });
  }
  console.log(`Spawned ${count} food items`);
}

/**
 * Check if a shrimp can eat food and grow
 * Updates shrimp size and removes eaten food
 */
export function processEating(): void {
  // Verify we have valid game state
  if (shrimps.size === 0) {
    return; // No shrimps to process
  }
  
  // Process collisions between shrimp and food
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
        // Increase shrimp size (grow) up to maximum
        if (shrimp.size < MAX_SHRIMP_SIZE) {
          shrimp.size += GROWTH_PER_FOOD;
          
          // Ensure size doesn't exceed maximum
          if (shrimp.size > MAX_SHRIMP_SIZE) {
            shrimp.size = MAX_SHRIMP_SIZE;
          }
        }
        
        // Increase score
        shrimp.score += SCORE_PER_FOOD;
        
        // Remove the eaten food
        foods.splice(i, 1);
        
        console.log(`Shrimp ${shrimp.id} ate food, new size: ${shrimp.size}, score: ${shrimp.score}`);
        
        // Spawn a new food to replace the eaten one
        const position = getRandomPosition();
        foods.push({
          x: position.x,
          y: position.y,
          size: getRandomFoodSize()  // Random size between MIN and MAX
        });
      }
    }
  });
  
  // Process collisions between shrimps
  const shrimpArray = Array.from(shrimps.values());
  
  // Check each pair of shrimps for collisions
  for (let i = 0; i < shrimpArray.length; i++) {
    const shrimp1 = shrimpArray[i];
    
    for (let j = i + 1; j < shrimpArray.length; j++) {
      const shrimp2 = shrimpArray[j];
      
      // Calculate distance between shrimps
      const dx = shrimp1.x - shrimp2.x;
      const dy = shrimp1.y - shrimp2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if they are close enough to collide (within size/2 distance)
      if (distance < (shrimp1.size + shrimp2.size) / 2) {
        // Determine which shrimp is larger
        if (shrimp1.size > shrimp2.size) {
          // Shrimp 1 eats Shrimp 2
          if (shrimp1.size < MAX_SHRIMP_SIZE) {
            shrimp1.size += GROWTH_PER_SHRIMP;
            if (shrimp1.size > MAX_SHRIMP_SIZE) {
              shrimp1.size = MAX_SHRIMP_SIZE;
            }
          }
          shrimp1.score += SCORE_PER_SHRIMP;
          
          // Log the event
          console.log(`Shrimp ${shrimp1.id} ate Shrimp ${shrimp2.id}, new size: ${shrimp1.size}, score: ${shrimp1.score}`);
          
          // Remove the eaten shrimp
          shrimps.delete(shrimp2.id);
          
          // Break inner loop since shrimp2 is gone
          break;
        } else if (shrimp2.size > shrimp1.size) {
          // Shrimp 2 eats Shrimp 1
          if (shrimp2.size < MAX_SHRIMP_SIZE) {
            shrimp2.size += GROWTH_PER_SHRIMP;
            if (shrimp2.size > MAX_SHRIMP_SIZE) {
              shrimp2.size = MAX_SHRIMP_SIZE;
            }
          }
          shrimp2.score += SCORE_PER_SHRIMP;
          
          // Log the event
          console.log(`Shrimp ${shrimp2.id} ate Shrimp ${shrimp1.id}, new size: ${shrimp2.size}, score: ${shrimp2.score}`);
          
          // Remove the eaten shrimp
          shrimps.delete(shrimp1.id);
          
          // Break both loops since shrimp1 is gone
          i = shrimpArray.length; // Force outer loop exit
          break;
        }
        // If they're the same size, no one gets eaten
      }
    }
  }
  
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