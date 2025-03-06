/**
 * Backend Server Entry Point
 * 
 * This file serves as the entry point for the backend server,
 * importing the server implementation from src/server.ts
 */

// Import required to support TypeScript
require('ts-node/register');

// Load environment variables
require('dotenv').config();

// Import the actual server implementation
require('./src/server');

console.log('Backend server started via index.js entry point');