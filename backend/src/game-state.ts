/**
 * Game State Management Module
 * 
 * This module handles all game state management including:
 * - Player (shrimp) creation, removal, and movement
 * - Food spawning and management
 * - Collision detection and eating mechanics
 * - Score and size progression
 * 
 * The game state is centrally managed here with an authoritative
 * server model where clients only render state, not modify it.
 * 
 * @module game-state
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Game configuration constants
 * These values control core game mechanics and balance
 */
interface GameConfig {
  mapWidth: number;         // Game world width
  mapHeight: number;        // Game world height
  initialShrimpSize: number; // Starting size for new players
  maxShrimpSize: number;    // Maximum possible shrimp size
  initialFoodCount: number; // Food items at game start
  minFoodSize: number;      // Minimum food size
  maxFoodSize: number;      // Maximum food size
  growthPerFood: number;    // Size increase per food eaten
  growthPerShrimp: number;  // Size increase per shrimp eaten
  scorePerFood: number;     // Score gain per food eaten
  scorePerShrimp: number;   // Score gain per shrimp eaten
}

/**
 * Game configuration settings
 * Centralized configuration object to control game balance
 */
const CONFIG: GameConfig = {
  mapWidth: 800,
  mapHeight: 600,
  initialShrimpSize: 10,
  maxShrimpSize: 50,
  initialFoodCount: 10,
  minFoodSize: 4,
  maxFoodSize: 6,
  growthPerFood: 1,
  growthPerShrimp: 5,
  scorePerFood: 5,
  scorePerShrimp: 20
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for shrimp players
 * Represents a player entity in the game world
 */
export interface Shrimp {
  id: string;      // Unique player identifier (socket ID)
  x: number;       // X position on the map
  y: number;       // Y position on the map
  size: number;    // Size of the shrimp (grows as it eats)
  score: number;   // Player's score
}

/**
 * Interface for food items
 * Represents consumable entities that make shrimps grow
 */
export interface Food {
  x: number;       // X position on the map
  y: number;       // Y position on the map
  size: number;    // Size of the food item
}

/**
 * Interface for the complete game state
 * Represents the entire game world state
 */
export interface GameState {
  shrimps: Shrimp[];
  foods: Food[];
}

// =============================================================================
// STATE STORAGE
// =============================================================================

/**
 * Game state storage
 * Using Map for O(1) lookup of shrimps by ID, Array for foods
 */
const shrimps: Map<string, Shrimp> = new Map();
const foods: Food[] = [];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a random position within the map boundaries
 * Ensures entities don't spawn too close to edges by applying a margin
 * 
 * @returns {object} Random position coordinates {x, y}
 */
function getRandomPosition(): { x: number, y: number } {
  // Add margin to ensure entities are visible
  const margin = 50;
  return {
    x: margin + Math.floor(Math.random() * (CONFIG.mapWidth - 2 * margin)),
    y: margin + Math.floor(Math.random() * (CONFIG.mapHeight - 2 * margin))
  };
}

/**
 * Generates a random food size within the defined range
 * Used when spawning new food entities
 * 
 * @returns {number} Random food size between min and max
 */
function getRandomFoodSize(): number {
  return CONFIG.minFoodSize + Math.floor(Math.random() * (CONFIG.maxFoodSize - CONFIG.minFoodSize + 1));
}

// =============================================================================
// PLAYER MANAGEMENT
// =============================================================================

/**
 * Add a new shrimp when a player connects
 * Creates a new player entity with initial properties
 * 
 * @param {string} id The socket ID of the connecting player
 * @returns {Shrimp} The newly created shrimp
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
    size: CONFIG.initialShrimpSize,
    score: 0
  };
  
  // Store the shrimp in the map
  shrimps.set(id, newShrimp);
  console.log(`Shrimp added: ${id} at position (${newShrimp.x}, ${newShrimp.y})`);
  
  return newShrimp;
}

/**
 * Remove a shrimp when a player disconnects
 * Cleanly removes a player from the game world
 * 
 * @param {string} id The socket ID of the disconnecting player
 * @returns {boolean} True if the shrimp was successfully removed
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
 * Validates and applies position updates while ensuring map boundaries
 * 
 * @param {string} id The socket ID of the player
 * @param {number} x The new X position
 * @param {number} y The new Y position
 * @returns {Shrimp | null} The updated shrimp or null if not found
 */
export function updateShrimpPosition(id: string, x: number, y: number): Shrimp | null {
  const shrimp = shrimps.get(id);
  if (!shrimp) {
    console.warn(`Tried to update position for non-existent shrimp: ${id}`);
    return null;
  }
  
  // Update the shrimp's position, ensuring it stays within map boundaries
  shrimp.x = Math.max(0, Math.min(CONFIG.mapWidth, x));
  shrimp.y = Math.max(0, Math.min(CONFIG.mapHeight, y));
  
  // Update the shrimp in the map
  shrimps.set(id, shrimp);
  return shrimp;
}

// =============================================================================
// FOOD MANAGEMENT
// =============================================================================

/**
 * Spawn food items randomly on the map
 * Creates new food entities at random positions
 * 
 * @param {number} count Number of food items to spawn
 */
export function spawnFood(count: number = CONFIG.initialFoodCount): void {
  for (let i = 0; i < count; i++) {
    const position = getRandomPosition();
    foods.push({
      x: position.x,
      y: position.y,
      size: getRandomFoodSize()
    });
  }
  console.log(`Spawned ${count} food items`);
}

// =============================================================================
// COLLISION DETECTION & GAME MECHANICS
// =============================================================================

/**
 * Check if a shrimp can eat food and grow
 * Core game mechanic that handles:
 * 1. Shrimp-food collision detection
 * 2. Shrimp-shrimp collision detection
 * 3. Size and score updates
 * 4. Food respawning
 */
export function processEating(): void {
  // Verify we have valid game state
  if (shrimps.size === 0) {
    return; // No shrimps to process
  }
  
  // -------------------------------------------------------------------------
  // PART 1: Process collisions between shrimp and food
  // -------------------------------------------------------------------------
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
        if (shrimp.size < CONFIG.maxShrimpSize) {
          shrimp.size += CONFIG.growthPerFood;
          
          // Ensure size doesn't exceed maximum
          if (shrimp.size > CONFIG.maxShrimpSize) {
            shrimp.size = CONFIG.maxShrimpSize;
          }
        }
        
        // Increase score
        shrimp.score += CONFIG.scorePerFood;
        
        // Remove the eaten food
        foods.splice(i, 1);
        
        console.log(`Shrimp ${shrimp.id} ate food, new size: ${shrimp.size}, score: ${shrimp.score}`);
        
        // Spawn a new food to replace the eaten one
        const position = getRandomPosition();
        foods.push({
          x: position.x,
          y: position.y,
          size: getRandomFoodSize()
        });
      }
    }
  });
  
  // -------------------------------------------------------------------------
  // PART 2: Process collisions between shrimps
  // -------------------------------------------------------------------------
  const shrimpArray = Array.from(shrimps.values());
  
  // Check each pair of shrimps for collisions (O(n²) operation)
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
          if (shrimp1.size < CONFIG.maxShrimpSize) {
            shrimp1.size += CONFIG.growthPerShrimp;
            if (shrimp1.size > CONFIG.maxShrimpSize) {
              shrimp1.size = CONFIG.maxShrimpSize;
            }
          }
          shrimp1.score += CONFIG.scorePerShrimp;
          
          // Log the event
          console.log(`Shrimp ${shrimp1.id} ate Shrimp ${shrimp2.id}, new size: ${shrimp1.size}, score: ${shrimp1.score}`);
          
          // Remove the eaten shrimp
          shrimps.delete(shrimp2.id);
          
          // Break inner loop since shrimp2 is gone
          break;
        } else if (shrimp2.size > shrimp1.size) {
          // Shrimp 2 eats Shrimp 1
          if (shrimp2.size < CONFIG.maxShrimpSize) {
            shrimp2.size += CONFIG.growthPerShrimp;
            if (shrimp2.size > CONFIG.maxShrimpSize) {
              shrimp2.size = CONFIG.maxShrimpSize;
            }
          }
          shrimp2.score += CONFIG.scorePerShrimp;
          
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
  
  // -------------------------------------------------------------------------
  // PART 3: Ensure minimum food count
  // -------------------------------------------------------------------------
  
  // If food count drops below initial count for any reason, spawn more
  if (foods.length < CONFIG.initialFoodCount) {
    spawnFood(CONFIG.initialFoodCount - foods.length);
  }
}

// =============================================================================
// STATE ACCESS
// =============================================================================

/**
 * Gets the current game state
 * Provides a snapshot of the current game world
 * 
 * @returns {GameState} Current game state with shrimps and foods
 */
export function getGameState(): GameState {
  return {
    shrimps: Array.from(shrimps.values()),
    foods: [...foods]
  };
}

/**
 * Initialize the game state
 * Sets up the initial game world with food
 */
export function initGameState(): void {
  // Clear any existing state
  shrimps.clear();
  foods.length = 0;
  
  // Spawn initial food
  spawnFood();
  
  console.log(`Game state initialized with ${foods.length} food items`);
} 