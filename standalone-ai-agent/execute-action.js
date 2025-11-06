#!/usr/bin/env node

/**
 * ⚡ Execute Action - Make Ollama GUI Functional
 *
 * This tool takes Ollama GUI responses and executes the blockchain actions.
 *
 * How to use:
 * 1. Chat with RugBot in Ollama GUI
 * 2. Copy RugBot's response (with [ACTION:...] tags)
 * 3. Run: npm run execute "paste the response here"
 * 4. Actions are executed automatically!
 *
 * Usage: npm run execute "RugBot response with action tags"
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
  }
};

class ActionExecutor {
  constructor() {
    this.apiBaseUrl = config.api.baseUrl;
  }

  parseActionTags(response) {
    // Look for action tags in the response
    const actionRegex = /\[ACTION:(\w+)(?:,(\w+):([^,\]]+))?(?:,(\w+):([^,\]]+))?\]/g;
    const actions = [];
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
      const action = {
        type: match[1],
        params: {}
      };

      // Parse additional parameters
      for (let i = 2; i < match.length; i += 2) {
        if (match[i] && match[i + 1]) {
          action.params[match[i]] = match[i + 1];
        }
      }

      actions.push(action);
    }

    return actions;
  }

  async executeAction(action) {
    try {
      let url, method = 'GET', body = null;

      switch (action.type) {
        case 'check_rug':
          url = `${this.apiBaseUrl}/rug/${action.params.tokenId}/status`;
          break;

        case 'clean_rug':
          url = `${this.apiBaseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'clean' });
          break;

        case 'restore_rug':
          url = `${this.apiBaseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'restore' });
          break;

        case 'master_restore_rug':
        case 'master_rug':
          url = `${this.apiBaseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'master' });
          break;

        case 'authorize_agent':
          url = `${this.apiBaseUrl}/agent/authorize`;
          method = 'POST';
          break;

        case 'get_earnings':
        case 'get_stats':
          url = `${this.apiBaseUrl}/agent/stats`;
          break;

        default:
          console.log(chalk.yellow(`⚠️  Unknown action type: ${action.type}`));
          console.log(chalk.gray('   Supported: check_rug, clean_rug, restore_rug, master_restore_rug, authorize_agent, get_earnings'));
          return null;
      }

      console.log(chalk.blue(`🔧 Executing ${action.type}...`));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      const result = await response.json();

      if (result.success) {
        console.log(chalk.green(`✅ ${action.type} completed successfully!`));

        // Show detailed results
        if (action.type === 'check_rug') {
          console.log(chalk.cyan(`🏠 Rug #${result.data.tokenId}:`));
          console.log(chalk.gray(`   Can Clean: ${result.data.canClean} (${result.data.cleaningCostEth} ETH)`));
          console.log(chalk.gray(`   Can Restore: ${result.data.canRestore} (${result.data.restorationCostEth} ETH)`));
          console.log(chalk.gray(`   Needs Master: ${result.data.needsMaster} (${result.data.masterCostEth} ETH)`));
        } else if (action.type.includes('_rug')) {
          console.log(chalk.cyan(`💰 Transaction Details:`));
          console.log(chalk.gray(`   Action: ${result.action}`));
          console.log(chalk.gray(`   Maintenance Cost: ${result.maintenanceCostEth} ETH`));
          console.log(chalk.gray(`   Service Fee Earned: ${result.serviceFeeEth} ETH`));
          console.log(chalk.gray(`   Total Cost: ${result.totalCostEth} ETH`));
          console.log(chalk.gray(`   Tx Hash: ${result.txHash}`));
        } else if (action.type === 'get_earnings' || action.type === 'get_stats') {
          console.log(chalk.cyan(`📊 Agent Statistics:`));
          console.log(chalk.gray(`   Total Earnings: ${result.totalEarningsEth} ETH`));
          console.log(chalk.gray(`   Maintenances: ${result.maintenanceCount}`));
          console.log(chalk.gray(`   Agent: ${result.agentName}`));
          console.log(chalk.gray(`   Network: ${result.network}`));
        }

        return result;
      } else {
        console.log(chalk.red(`❌ ${action.type} failed: ${result.error}`));
        return null;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Action execution failed: ${error.message}`));
      console.log(chalk.gray('💡 Make sure API server is running: npm run api-server'));
      return null;
    }
  }

  async executeFromResponse(responseText) {
    console.log(chalk.blue('🔍 Parsing Ollama response for actions...\n'));

    // Parse action tags from the response
    const actions = this.parseActionTags(responseText);

    if (actions.length === 0) {
      console.log(chalk.yellow('⚠️  No action tags found in the response.'));
      console.log(chalk.gray('💡 RugBot should respond with [ACTION:action_name,param:value] format'));
      console.log(chalk.gray('   Example: [ACTION:clean_rug,tokenId:1] I\'ll clean that rug!'));

      // Show what was found
      console.log(chalk.gray('\nResponse received:'));
      console.log(chalk.white(responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')));

      return;
    }

    console.log(chalk.green(`🎯 Found ${actions.length} action(s) to execute:\n`));

    for (const action of actions) {
      console.log(chalk.cyan(`Action: ${action.type}`));
      if (Object.keys(action.params).length > 0) {
        console.log(chalk.gray(`Params: ${JSON.stringify(action.params)}`));
      }
      console.log('');

      const result = await this.executeAction(action);
      if (result) {
        console.log(chalk.green(`✅ Action completed successfully!\n`));
      } else {
        console.log(chalk.red(`❌ Action failed.\n`));
      }

      // Small delay between actions
      await this.sleep(500);
    }

    console.log(chalk.magenta('🎉 All actions processed!'));
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI runner
async function main() {
  console.log(chalk.bold.blue('⚡ Ollama GUI Action Executor\n'));

  const executor = new ActionExecutor();

  // Get the response text from command line arguments
  const args = process.argv.slice(2);
  const responseText = args.join(' ');

  if (!responseText) {
    console.log(chalk.yellow('Usage: npm run execute "paste RugBot response here"'));
    console.log(chalk.gray('\nExample:'));
    console.log(chalk.gray('npm run execute "[ACTION:clean_rug,tokenId:1] I\'ll clean that rug!"'));
    console.log(chalk.gray('\nHow to use:'));
    console.log(chalk.gray('1. Chat with RugBot in Ollama GUI'));
    console.log(chalk.gray('2. Copy RugBot\'s response (with [ACTION:...] tags)'));
    console.log(chalk.gray('3. Run: npm run execute "paste response here"'));
    console.log(chalk.gray('4. Actions execute automatically!'));

    process.exit(0);
  }

  try {
    await executor.executeFromResponse(responseText);
  } catch (error) {
    console.error(chalk.red('💥 Action execution crashed:'), error);
    process.exit(1);
  }
}

// Export for testing
export default ActionExecutor;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('💥 Executor crashed:'), error);
    process.exit(1);
  });
}
