#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this script to validate that all required environment variables are set
 */

require('dotenv').config();

const requiredVars = {
  // Database
  'SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_ANON_KEY': 'Supabase anonymous key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
  
  // Security
  'JWT_SECRET': 'JWT signing secret',
  
  // AI Service
  'OPENROUTER_API_KEY': 'OpenRouter API key for AI interventions'
};

const optionalVars = {
  'REDIS_HOST': 'Redis host (defaults to localhost)',
  'REDIS_PORT': 'Redis port (defaults to 6379)',
  'PORT': 'Server port (defaults to 3000)',
  'NODE_ENV': 'Environment (defaults to development)'
};

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
Object.entries(requiredVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing - ${description}`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value.substring(0, 50) + (value.length > 50 ? '...' : '');
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

console.log('\n📋 Optional Variables:');
Object.entries(optionalVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set - ${description}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Environment validation failed!');
  console.log('Please set the missing environment variables and try again.');
  console.log('See .env.example for reference values.');
  process.exit(1);
} else {
  console.log('✅ Environment validation passed!');
  console.log('All required environment variables are set.');
}