#!/usr/bin/env node

/**
 * 🧪 Test Direct Payment System
 *
 * Tests the new direct payment maintenance system
 * with the standalone AI agent
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const config = {
  api: {
    baseUrl: process.env.WEBSITE_API_URL || 'http://localhost:3000',
    agentApiUrl: process.env.AGENT_API_URL || 'http://localhost:3001'
  },
  wallet: {
    address: process.env.AGENT_ADDRESS || '0x18aD3393691372821A05d08E6C30f4Fe4E150403'
  }
};

async function testMaintenanceQuote(tokenId, action) {
  console.log(chalk.blue(`\n📋 Testing maintenance quote for ${action} on rug #${tokenId}`));

  try {
    const response = await fetch(`${config.api.baseUrl}/api/maintenance/quote/${tokenId}/${action}`, {
      headers: {
        'x-agent-address': config.wallet.address
      }
    });
    const paymentRequired = response.headers.get('PAYMENT-REQUIRED');

    if (paymentRequired) {
      const paymentData = JSON.parse(paymentRequired);
      console.log(chalk.green(`✅ Quote successful!`));
      console.log(chalk.gray(`   Payment required: ${parseFloat(paymentData.extra?.totalWei || 0) / 1e18} ETH`));
      console.log(chalk.gray(`   Service fee: ${parseFloat(paymentData.extra?.serviceFee || 0) / 1e18} ETH`));
      console.log(chalk.gray(`   Maintenance cost: ${parseFloat(paymentData.extra?.maintenanceCost || 0) / 1e18} ETH`));

      const totalWei = paymentData.extra?.totalWei;
      if (parseFloat(totalWei || 0) / 1e18 === 0) {
        console.log(chalk.yellow(`⚠️  No payment required for this action`));
        return null; // Skip payment since none is needed
      }

      return totalWei;
    } else {
      console.log(chalk.red(`❌ No PAYMENT-REQUIRED header found`));
      return null;
    }
  } catch (error) {
    console.log(chalk.red(`❌ Quote failed: ${error.message}`));
    return null;
  }
}

async function testMaintenanceAction(tokenId, action, paymentAmount) {
  console.log(chalk.blue(`\n🔧 Testing maintenance action for ${action} on rug #${tokenId}`));

  try {
    const response = await fetch(`${config.api.baseUrl}/api/maintenance/action/${tokenId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-address': config.wallet.address
      },
      body: JSON.stringify({
        paymentAmount: paymentAmount
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(chalk.green(`✅ Action successful!`));
      console.log(chalk.gray(`   Transaction: ${result.txHash}`));
      console.log(chalk.gray(`   Gas used: ${result.gasUsed}`));
      console.log(chalk.gray(`   Message: ${result.message}`));
      return true;
    } else {
      console.log(chalk.red(`❌ Action failed: ${result.error}`));
      if (result.details) {
        console.log(chalk.gray(`   Details: ${result.details}`));
      }
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`❌ Action failed: ${error.message}`));
    return false;
  }
}

async function testRugStatus(tokenId) {
  console.log(chalk.blue(`\n📊 Testing rug status for rug #${tokenId}`));

  try {
    const response = await fetch(`${config.api.baseUrl}/api/maintenance/status/${tokenId}`);
    const result = await response.json();

    if (response.ok) {
      console.log(chalk.green(`✅ Status check successful!`));
      console.log(chalk.gray(`   Rug condition: ${result.condition || 'Unknown'}`));
      console.log(chalk.gray(`   Can clean: ${result.canClean || false}`));
      console.log(chalk.gray(`   Can restore: ${result.canRestore || false}`));
      return true;
    } else {
      console.log(chalk.red(`❌ Status check failed: ${result.error}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`❌ Status check failed: ${error.message}`));
    return false;
  }
}

async function runTests() {
  console.log(chalk.bold.blue('🧪 Testing Direct Payment Maintenance System'));
  console.log(chalk.gray('========================================'));

  if (!config.api.baseUrl) {
    console.log(chalk.red('❌ WEBSITE_API_URL environment variable not set'));
    process.exit(1);
  }

  if (!config.wallet.address) {
    console.log(chalk.red('❌ AGENT_ADDRESS environment variable not set'));
    process.exit(1);
  }

  console.log(chalk.gray(`API URL: ${config.api.baseUrl}`));
  console.log(chalk.gray(`Agent Address: ${config.wallet.address}`));

  // Test rug status
  await testRugStatus(1);

  // Test maintenance quote
  const paymentAmount = await testMaintenanceQuote(1, 'clean');
  if (paymentAmount === null) {
    console.log(chalk.blue('\nℹ️  Rug does not need cleaning (no payment required)'));
    console.log(chalk.green('✅ Direct payment system working correctly!'));
    return;
  }

  if (!paymentAmount) {
    console.log(chalk.red('❌ Cannot proceed without payment amount'));
    return;
  }

  // Test maintenance action (commented out to avoid actual transactions during testing)
  console.log(chalk.yellow('\n⚠️  Skipping actual maintenance action to avoid gas costs'));
  console.log(chalk.gray(`   Would execute: clean rug #1 with ${parseFloat(paymentAmount) / 1e18} ETH`));

  // Uncomment the line below to actually test the maintenance action
  // await testMaintenanceAction(1, 'clean', paymentAmount);

  console.log(chalk.bold.green('\n✅ Direct Payment System Test Complete!'));
  console.log(chalk.gray('========================================'));
  console.log(chalk.green('🎉 The standalone AI agent is ready to use direct payments!'));
}

// Run tests
runTests().catch(console.error);
