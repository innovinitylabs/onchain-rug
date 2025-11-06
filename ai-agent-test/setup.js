#!/usr/bin/env node

/**
 * 🛠️ Setup Script for Ollama x402 Rug Maintenance Agent
 *
 * This script helps configure the AI agent by:
 * - Checking Ollama installation and models
 * - Setting up wallet configuration
 * - Testing API connectivity
 * - Creating .env file
 */

import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Ollama } from 'ollama';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';

const OLLAMA_MODELS = ['llama3.2:3b', 'llama3.1:8b', 'mistral:7b', 'codellama:7b'];
const CONFIG_FILE = '.env';

class AgentSetup {
  constructor() {
    this.config = {};
  }

  async checkOllama() {
    console.log(chalk.blue('\n🔍 Checking Ollama installation...\n'));

    try {
      // Check if ollama command exists
      execSync('ollama --version', { stdio: 'pipe' });
      console.log(chalk.green('✅ Ollama CLI found'));
    } catch (error) {
      console.log(chalk.red('❌ Ollama CLI not found'));
      console.log(chalk.yellow('💡 Install Ollama from: https://ollama.ai/download'));
      return false;
    }

    // Check if Ollama server is running
    try {
      const ollama = new Ollama();
      const models = await ollama.list();
      console.log(chalk.green('✅ Ollama server running'));
      console.log(chalk.gray(`   Available models: ${models.models.length}`));

      // Check for recommended models
      const availableModels = models.models.map(m => m.name);
      const recommendedModels = OLLAMA_MODELS.filter(model =>
        availableModels.some(am => am.includes(model.split(':')[0]))
      );

      if (recommendedModels.length > 0) {
        console.log(chalk.green('✅ Recommended models available:'));
        recommendedModels.forEach(model => console.log(chalk.gray(`   - ${model}`)));
        this.config.OLLAMA_MODEL = recommendedModels[0];
      } else {
        console.log(chalk.yellow('⚠️  No recommended models found'));
        console.log(chalk.gray('   Recommended: llama3.2:3b, mistral:7b'));
        console.log(chalk.gray('   Run: ollama pull llama3.2:3b'));
      }

      return true;
    } catch (error) {
      console.log(chalk.red('❌ Ollama server not running'));
      console.log(chalk.yellow('💡 Start Ollama: ollama serve'));
      return false;
    }
  }

  async checkAPI() {
    console.log(chalk.blue('\n🔗 Checking API connectivity...\n'));

    const apiUrls = [
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    for (const url of apiUrls) {
      try {
        console.log(chalk.gray(`Testing ${url}...`));
        const response = await fetch(`${url}/api/maintenance/status/1`, {
          timeout: 5000
        });

        if (response.ok) {
          console.log(chalk.green(`✅ API responding at ${url}`));
          this.config.RUG_API_BASE = url;
          return true;
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    console.log(chalk.red('❌ Could not connect to rug maintenance API'));
    console.log(chalk.yellow('💡 Make sure the main app is running: npm run dev'));
    console.log(chalk.gray('   API should be available at http://localhost:3000'));

    // Ask user to continue anyway
    const continueAnyway = await this.askQuestion('Continue setup anyway? (y/N): ');
    if (continueAnyway.toLowerCase() === 'y') {
      this.config.RUG_API_BASE = 'http://localhost:3000';
      return true;
    }

    return false;
  }

  async setupWallet() {
    console.log(chalk.blue('\n👛 Setting up wallet configuration...\n'));

    console.log(chalk.gray('You can either:'));
    console.log(chalk.gray('1. Create a new agent wallet'));
    console.log(chalk.gray('2. Use an existing private key'));
    console.log(chalk.gray('3. Skip wallet setup (simulation mode only)'));

    const choice = await this.askQuestion('Choose option (1/2/3): ');

    switch (choice) {
      case '1':
        await this.createNewWallet();
        break;
      case '2':
        await this.useExistingWallet();
        break;
      case '3':
      default:
        console.log(chalk.yellow('⚠️  Skipping wallet setup - agent will run in simulation mode'));
        console.log(chalk.gray('   You can add wallet later by editing .env'));
        break;
    }
  }

  async createNewWallet() {
    console.log(chalk.gray('Generating new agent wallet...'));

    try {
      // Generate new private key
      const wallet = createWalletClient({
        chain: baseSepolia,
        transport: http()
      });

      // Note: In a real implementation, you'd generate a proper private key
      // For demo purposes, we'll ask user to provide one
      console.log(chalk.yellow('⚠️  For security, please generate your own private key:'));
      console.log(chalk.gray('   cast wallet new'));
      console.log(chalk.gray('   Or use a wallet like MetaMask to create a new account'));

      const privateKey = await this.askQuestion('Enter agent private key (0x...): ');
      if (privateKey && privateKey.startsWith('0x')) {
        this.config.AGENT_PRIVATE_KEY = privateKey;
        console.log(chalk.green('✅ Agent wallet configured'));

        // Derive address
        const { privateKeyToAccount } = await import('viem/accounts');
        const account = privateKeyToAccount(privateKey);
        this.config.AGENT_ADDRESS = account.address;
        console.log(chalk.gray(`   Address: ${account.address}`));
      }
    } catch (error) {
      console.log(chalk.red('❌ Wallet creation failed:'), error.message);
    }
  }

  async useExistingWallet() {
    const privateKey = await this.askQuestion('Enter agent private key (0x...): ');
    if (privateKey && privateKey.startsWith('0x')) {
      this.config.AGENT_PRIVATE_KEY = privateKey;
      console.log(chalk.green('✅ Agent wallet configured'));
    }
  }

  async setupOwnerWallet() {
    console.log(chalk.blue('\n👤 Setting up owner wallet (for authorization)...\n'));

    console.log(chalk.gray('This is optional but needed to authorize the agent'));
    console.log(chalk.gray('You can authorize manually or skip this step'));

    const setup = await this.askQuestion('Set up owner wallet? (y/N): ');
    if (setup.toLowerCase() === 'y') {
      const privateKey = await this.askQuestion('Enter owner private key (0x...): ');
      if (privateKey && privateKey.startsWith('0x')) {
        this.config.OWNER_PRIVATE_KEY = privateKey;
        console.log(chalk.green('✅ Owner wallet configured'));
      }
    }
  }

  async configureSettings() {
    console.log(chalk.blue('\n⚙️  Configuring agent settings...\n'));

    // Test token ID
    const tokenId = await this.askQuestion('Test token ID (1): ') || '1';
    this.config.TEST_TOKEN_ID = tokenId;

    // Auto maintenance
    const auto = await this.askQuestion('Enable auto maintenance? (y/N): ');
    this.config.AUTO_MAINTAIN = auto.toLowerCase() === 'y' ? 'true' : 'false';

    // Check interval
    const interval = await this.askQuestion('Check interval (seconds) (300): ') || '300';
    this.config.MAINTENANCE_CHECK_INTERVAL = (parseInt(interval) * 1000).toString();

    console.log(chalk.green('✅ Settings configured'));
  }

  async createConfigFile() {
    console.log(chalk.blue('\n📝 Creating configuration file...\n'));

    // Load example config
    const exampleConfig = readFileSync('config.example.env', 'utf8');
    let configContent = exampleConfig;

    // Replace with our configured values
    Object.entries(this.config).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      configContent = configContent.replace(regex, `${key}=${value}`);
    });

    // Write config file
    writeFileSync(CONFIG_FILE, configContent);
    console.log(chalk.green(`✅ Configuration saved to ${CONFIG_FILE}`));

    // Show important reminders
    console.log(chalk.yellow('\n⚠️  Important Security Notes:'));
    console.log(chalk.gray('   - Never share your private keys'));
    console.log(chalk.gray('   - Fund your agent wallet with testnet ETH'));
    console.log(chalk.gray('   - Authorize the agent before enabling auto mode'));
  }

  async askQuestion(question) {
    return new Promise(resolve => {
      process.stdout.write(chalk.cyan(question));
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
  }

  async run() {
    console.log(chalk.bold.blue('🛠️  Ollama x402 Rug Maintenance Agent Setup\n'));

    try {
      // Check Ollama
      const ollamaOk = await this.checkOllama();
      if (!ollamaOk) return;

      // Check API
      const apiOk = await this.checkAPI();
      if (!apiOk) return;

      // Setup wallet
      await this.setupWallet();

      // Setup owner wallet
      await this.setupOwnerWallet();

      // Configure settings
      await this.configureSettings();

      // Create config file
      await this.createConfigFile();

      console.log(chalk.green('\n🎉 Setup completed successfully!'));
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(chalk.gray('   1. Fund agent wallet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet'));
      console.log(chalk.gray('   2. Authorize agent: npm start authorize'));
      console.log(chalk.gray('   3. Test agent: npm start once'));
      console.log(chalk.gray('   4. Run autonomous: npm start auto'));

    } catch (error) {
      console.error(chalk.red('💥 Setup failed:'), error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  }
}

// Run setup
const setup = new AgentSetup();
setup.run();
