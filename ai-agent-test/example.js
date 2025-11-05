#!/usr/bin/env node

/**
 * 📖 Example Usage of Ollama x402 Rug Maintenance Agent
 *
 * This file demonstrates how to use the AI agent programmatically
 * in your own applications or scripts.
 */

import OllamaRugMaintenanceAgent from './agent.js';
import dotenv from 'dotenv';

// Load configuration
dotenv.config();

async function exampleBasicUsage() {
  console.log('🧪 Basic Agent Usage Example\n');

  // Initialize agent
  const agent = new OllamaRugMaintenanceAgent();

  // Initialize (checks connections)
  const ready = await agent.initialize();
  if (!ready) {
    console.log('❌ Agent not ready');
    return;
  }

  // Check a specific rug
  console.log('Checking rug #1...');
  const status = await agent.checkRugStatus(1);

  if (status?.maintenance.canClean) {
    console.log('Rug needs cleaning!');

    // Get maintenance quote
    const quote = await agent.getMaintenanceQuote(1, 'clean');
    console.log('Quote received:', quote ? '✅' : '❌');

    // AI analysis
    const analysis = await agent.analyzeRugWithAI(status);
    console.log('AI recommends:', analysis?.recommendedAction);

    // Execute maintenance (simulation mode if no wallet)
    if (analysis?.recommendedAction === 'clean') {
      console.log('Executing maintenance...');
      const success = await agent.executeMaintenance(1, quote);
      console.log('Maintenance result:', success ? '✅' : '❌');
    }
  }

  // Show stats
  await agent.showStats();
}

async function exampleAutonomousMode() {
  console.log('🤖 Autonomous Mode Example\n');

  const agent = new OllamaRugMaintenanceAgent();
  const ready = await agent.initialize();

  if (!ready) return;

  console.log('Starting autonomous mode for 30 seconds...');

  // Start autonomous mode in background
  const autonomousPromise = agent.startAutonomousMode();

  // Stop after 30 seconds
  setTimeout(() => {
    agent.stop();
  }, 30000);

  // Wait for completion
  await autonomousPromise;

  console.log('Autonomous mode completed');
  await agent.showStats();
}

async function exampleMultiRugMonitoring() {
  console.log('🔍 Multi-Rug Monitoring Example\n');

  const agent = new OllamaRugMaintenanceAgent();
  const ready = await agent.initialize();

  if (!ready) return;

  // Monitor multiple rugs
  const rugIds = [1, 2, 3, 5];

  console.log(`Checking ${rugIds.length} rugs...`);

  for (const rugId of rugIds) {
    console.log(`\n🏠 Rug #${rugId}`);
    console.log('─'.repeat(20));

    const status = await agent.checkRugStatus(rugId);

    if (status) {
      // Quick analysis
      const needsAttention = status.maintenance.canClean ||
                           status.maintenance.canRestore ||
                           status.maintenance.needsMaster;

      console.log(`   Status: ${needsAttention ? '🟡 Needs attention' : '🟢 Good condition'}`);

      if (needsAttention) {
        const analysis = await agent.analyzeRugWithAI(status);
        console.log(`   AI Action: ${analysis?.recommendedAction || 'unknown'}`);
        console.log(`   Earnings: ${analysis?.expectedEarnings || '0'} ETH`);
      }
    }
  }
}

async function exampleRevenueTracking() {
  console.log('💰 Revenue Tracking Example\n');

  const agent = new OllamaRugMaintenanceAgent();
  const ready = await agent.initialize();

  if (!ready) return;

  // Simulate multiple maintenance actions
  const actions = [
    { tokenId: 1, action: 'clean', fee: '0.001' },
    { tokenId: 2, action: 'restore', fee: '0.002' },
    { tokenId: 3, action: 'clean', fee: '0.001' },
    { tokenId: 1, action: 'master', fee: '0.005' }
  ];

  console.log('Simulating maintenance actions...');

  for (const action of actions) {
    // Simulate maintenance (would normally call executeMaintenance)
    agent.totalEarnings += BigInt(action.fee + '000000000000000000'); // Convert to wei
    agent.maintenanceCount++;

    console.log(`   ✅ Maintained rug #${action.tokenId} (${action.action}) - Earned ${action.fee} ETH`);
  }

  console.log('\n📊 Revenue Report:');
  await agent.showStats();

  // Calculate metrics
  const avgEarning = Number(agent.totalEarnings) / agent.maintenanceCount / 1e18;
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   Average earning per maintenance: ${avgEarning.toFixed(4)} ETH`);
  console.log(`   Total gas costs (estimated): ${(agent.maintenanceCount * 0.0001).toFixed(4)} ETH`);
  console.log(`   Net profit: ${(agent.totalEarnings / 1e18 - agent.maintenanceCount * 0.0001).toFixed(4)} ETH`);
}

async function exampleCustomAI() {
  console.log('🧠 Custom AI Integration Example\n');

  const agent = new OllamaRugMaintenanceAgent();
  const ready = await agent.initialize();

  if (!ready) return;

  // Custom AI prompt for specialized maintenance
  const customPrompt = `You are a specialized rug maintenance AI. Consider these factors:
- Material wear and tear
- Cleaning frequency requirements
- Restoration cost effectiveness
- Master restoration timing

Rug data: %RUG_DATA%

Respond with maintenance strategy considering long-term rug health.`;

  // Override the AI analysis method for custom logic
  agent.analyzeRugWithAI = async function(rugData) {
    const { Ollama } = await import('ollama');

    const ollama = new Ollama({
      host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });

    const prompt = customPrompt.replace('%RUG_DATA%', JSON.stringify(rugData));

    try {
      const response = await ollama.generate({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt: prompt,
        format: 'json'
      });

      return JSON.parse(response.response);
    } catch (error) {
      console.log('Custom AI analysis failed:', error.message);
      return null;
    }
  };

  // Test custom AI
  const status = await agent.checkRugStatus(1);
  if (status) {
    const analysis = await agent.analyzeRugWithAI(status);
    console.log('Custom AI Analysis:', analysis);
  }
}

// CLI runner
async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || 'basic';

  console.log('📖 Ollama x402 Rug Maintenance Agent - Examples\n');

  try {
    switch (example) {
      case 'basic':
        await exampleBasicUsage();
        break;

      case 'autonomous':
        await exampleAutonomousMode();
        break;

      case 'multi':
        await exampleMultiRugMonitoring();
        break;

      case 'revenue':
        await exampleRevenueTracking();
        break;

      case 'custom':
        await exampleCustomAI();
        break;

      default:
        console.log('Available examples:');
        console.log('  basic      - Basic agent usage');
        console.log('  autonomous - Autonomous mode demo');
        console.log('  multi      - Multi-rug monitoring');
        console.log('  revenue    - Revenue tracking simulation');
        console.log('  custom     - Custom AI integration');
        console.log('\nUsage: node example.js [example-name]');
        break;
    }
  } catch (error) {
    console.error('💥 Example failed:', error);
    process.exit(1);
  }
}

main();
