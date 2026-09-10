import { LLMManager } from '../services/llm/manager.js';
import { LLMConfig } from '../services/llm/types.js';

let llmManager: LLMManager | null = null;

export class LLMConfigManager {
  private async detectAndCreateConfig(): Promise<LLMConfig> {
    // Try to create config from environment variables
    const geminiKey = process.env.GEMINI_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    
    // Primary provider preference from env or default to gemini
    const primaryProvider = (process.env.PRIMARY_LLM_PROVIDER || 'gemini') as 'gemini' | 'claude' | 'openai' | 'perplexity';
    
    // Create config for primary provider if key exists
    if (primaryProvider === 'gemini' && geminiKey) {
      return {
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
        api_key: geminiKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (primaryProvider === 'claude' && claudeKey) {
      return {
        provider: 'claude',
        model: 'claude-sonnet-5',
        api_key: claudeKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (primaryProvider === 'openai' && openaiKey) {
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        api_key: openaiKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (primaryProvider === 'perplexity' && perplexityKey) {
      return {
        provider: 'perplexity',
        model: 'llama-3.1-sonar-small-128k-online',
        api_key: perplexityKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    }
    
    // Fallback to any available provider
    if (geminiKey) {
      return {
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
        api_key: geminiKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (claudeKey) {
      return {
        provider: 'claude',
        model: 'claude-sonnet-5',
        api_key: claudeKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (openaiKey) {
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        api_key: openaiKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    } else if (perplexityKey) {
      return {
        provider: 'perplexity',
        model: 'llama-3.1-sonar-small-128k-online',
        api_key: perplexityKey,
        max_tokens: 1000,
        temperature: 0.7
      };
    }
    
    throw new Error('No LLM API keys found in environment variables (GEMINI_API_KEY, CLAUDE_API_KEY, OPENAI_API_KEY, PERPLEXITY_API_KEY)');
  }

  private async getLLMManager(): Promise<LLMManager> {
  if (!llmManager) {
    llmManager = new LLMManager();

    const config = await this.detectAndCreateConfig();

    console.log(
      `🤖 Initializing primary LLM with provider: ${config.provider} (${config.model})`
    );

    let success = await llmManager.initialize(config);

    if (!success) {
      console.warn(
        `⚠️ Primary LLM initialization failed: ${config.provider}`
      );

      const fallbackProvider =
        process.env.FALLBACK_LLM_PROVIDER;

      console.log(
        `🔄 Configured fallback provider: ${
          fallbackProvider || 'none'
        }`
      );

      if (
        fallbackProvider &&
        fallbackProvider !== config.provider
      ) {
        const fallbackKeys: Record<string, string | undefined> = {
          gemini: process.env.GEMINI_API_KEY,
          claude: process.env.CLAUDE_API_KEY,
          openai: process.env.OPENAI_API_KEY,
          perplexity: process.env.PERPLEXITY_API_KEY
        };

        const fallbackModels: Record<string, string> = {
          gemini:
            process.env.GEMINI_MODEL ||
            'gemini-3.7-flash',
          claude:
            process.env.CLAUDE_MODEL ||
            'claude-sonnet-5',
          openai:
            process.env.OPENAI_MODEL ||
            'gpt-4o-mini',
          perplexity:
            process.env.PERPLEXITY_MODEL ||
            'llama-3.1-sonar-small-128k-online'
        };

        const fallbackApiKey =
          fallbackKeys[fallbackProvider];

        if (!fallbackApiKey) {
          throw new Error(
            `Primary provider ${config.provider} failed and fallback provider ${fallbackProvider} has no API key`
          );
        }

        const fallbackConfig: LLMConfig = {
          provider: fallbackProvider as LLMConfig['provider'],
          model: fallbackModels[fallbackProvider],
          api_key: fallbackApiKey,
          max_tokens: 1000,
          temperature: 0.7
        };

        console.log(
          `🔄 Attempting fallback initialization: ${fallbackConfig.provider} (${fallbackConfig.model})`
        );

        llmManager = new LLMManager();

        success =
          await llmManager.initialize(
            fallbackConfig
          );

        if (success) {
          console.log(
            `✅ Fallback LLM initialized successfully: ${fallbackConfig.provider}`
          );
        } else {
          throw new Error(
            `Primary provider ${config.provider} failed and fallback provider ${fallbackConfig.provider} also failed to initialize`
          );
        }
      } else {
        throw new Error(
          `Failed to initialize LLM with ${config.provider} and no fallback provider is configured`
        );
      }
    }
  }

  return llmManager;
}

  async initializeLLM(): Promise<boolean> {
    try {
      await this.getLLMManager();
      return true;
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
      return false;
    }
  }

  getCurrentInfo(): any {
    if (!llmManager) {
      return { provider: 'none', initialized: false };
    }
    const pricing = llmManager.getCurrentPricing();
    return {
      provider: pricing?.provider || 'unknown',
      model: pricing?.model || 'unknown',
      initialized: true
    };
  }

  async testConfiguration(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const manager = await this.getLLMManager();
      const testPrompt = 'Say "LLM test successful" if you can read this.';
      const response = await manager.analyzeFantasyData({
        context: {
          week: 1,
          day_of_week: 'Monday',
          action_type: 'analysis',
          priority: 'low'
        },
        data: {
          rosters: [],
          injuries: [],
          waiver_targets: [],
          league_info: [{ test_prompt: testPrompt }]
        }
      });
      
      return {
        success: true,
        response: response.summary
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateResponse(prompt: string): Promise<{ content: string; cost?: number }> {
    const manager = await this.getLLMManager();
    
    // Use direct LLM provider chat for simple text generation
    // This bypasses the complex fantasy analysis tools that might be causing issues
    try {
      const provider = manager.getCurrentProvider();
      if (!provider) {
        throw new Error('No LLM provider initialized');
      }
      
      const response = await provider.chat([
        { role: 'user', content: prompt }
      ], {
        max_tokens: 1000,
        temperature: 0.7
      });
      
      return {
        content: response.content || 'No response generated',
        cost: response.usage?.total_tokens ? response.usage.total_tokens * 0.000001 : 0.001 // Rough estimate
      };
    } catch (directError: any) {
      console.warn('Direct LLM call failed, trying fantasy analysis method:', directError.message);
      
      // Fallback to fantasy analysis method
      const response = await manager.analyzeFantasyData({
        context: {
          week: 1,
          day_of_week: 'Monday', 
          action_type: 'analysis',
          priority: 'medium'
        },
        data: {
          rosters: [],
          injuries: [],
          waiver_targets: [],
          league_info: [{ custom_prompt: prompt }]
        }
      });
      
      return {
        content: response.summary || 'Analysis completed',
        cost: response.cost_estimate?.estimated_cost
      };
    }
  }

  async switchProvider(provider: 'gemini' | 'claude' | 'openai' | 'perplexity'): Promise<boolean> {
    try {
      const config = await this.detectAndCreateConfig();
      config.provider = provider;
      
      // Get the correct API key for the provider
      switch (provider) {
        case 'gemini':
          config.api_key = process.env.GEMINI_API_KEY || '';
          config.model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
          break;
        case 'claude':
          config.api_key = process.env.CLAUDE_API_KEY || '';
          config.model = 'claude-sonnet-5';
          break;
        case 'openai':
          config.api_key = process.env.OPENAI_API_KEY || '';
          config.model = 'gpt-3.5-turbo';
          break;
        case 'perplexity':
          config.api_key = process.env.PERPLEXITY_API_KEY || '';
          config.model = 'llama-3.1-sonar-small-128k-online';
          break;
      }
      
      if (!config.api_key) {
        throw new Error(`No API key found for ${provider}`);
      }
      
      llmManager = new LLMManager();
      const success = await llmManager.initialize(config);
      return success;
    } catch (error) {
      console.error('Failed to switch provider:', error);
      return false;
    }
  }
}

export const llmConfig = new LLMConfigManager();
