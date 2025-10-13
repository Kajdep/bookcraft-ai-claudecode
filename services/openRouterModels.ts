import { log } from './logger';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

const OPENROUTER_MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

const MODEL_CACHE_KEY = 'bookcraft_openrouter_models_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ModelCache {
  timestamp: number;
  models: OpenRouterModel[];
}

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  if (!apiKey || !apiKey.trim()) {
    log.warn('OpenRouter API key not provided, using default models');
    return getDefaultModels();
  }

  // Check cache first
  try {
    const cached = localStorage.getItem(MODEL_CACHE_KEY);
    if (cached) {
      const cacheData: ModelCache = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age < CACHE_DURATION && cacheData.models && cacheData.models.length > 0) {
        log.debug('Using cached OpenRouter models', { count: cacheData.models.length, age });
        return cacheData.models;
      }
    }
  } catch (error) {
    log.warn('Failed to read model cache', error);
  }

  // Fetch fresh models
  try {
    log.debug('Fetching models from OpenRouter API');

    const response = await fetch(OPENROUTER_MODELS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenRouterModelsResponse = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    // Filter and sort models
    const models = data.data
      .filter(model => {
        // Only include models that are available and have basic info
        return model.id && model.name;
      })
      .sort((a, b) => {
        // Sort: free models first, then by name
        const aIsFree = a.id.includes(':free');
        const bIsFree = b.id.includes(':free');

        if (aIsFree && !bIsFree) return -1;
        if (!aIsFree && bIsFree) return 1;

        return a.name.localeCompare(b.name);
      });

    // Cache the results
    try {
      const cacheData: ModelCache = {
        timestamp: Date.now(),
        models,
      };
      localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(cacheData));
      log.debug('Cached OpenRouter models', { count: models.length });
    } catch (error) {
      log.warn('Failed to cache models', error);
    }

    log.info('Successfully fetched OpenRouter models', { count: models.length });
    return models;

  } catch (error) {
    log.error('Failed to fetch OpenRouter models', error as Error);

    // Return default models as fallback
    return getDefaultModels();
  }
}

export function getDefaultModels(): OpenRouterModel[] {
  return [
    {
      id: 'nvidia/nemotron-nano-9b-v2:free',
      name: 'Nemotron Nano 9B (Free)',
      description: 'Fast and efficient free model',
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'High-quality reasoning and writing',
    },
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      description: 'Fast and cost-effective',
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      description: 'OpenAI\'s latest multimodal model',
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Smaller, faster GPT-4o variant',
    },
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Advanced reasoning with large context',
    },
    {
      id: 'openai/gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Balanced performance and cost',
    },
    {
      id: 'google/gemini-pro-1.5',
      name: 'Gemini Pro 1.5',
      description: 'Google\'s advanced model',
    },
    {
      id: 'meta-llama/llama-3.1-405b-instruct',
      name: 'Llama 3.1 405B',
      description: 'Meta\'s largest open model',
    },
    {
      id: 'meta-llama/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B',
      description: 'Balanced open source model',
    },
    {
      id: 'mistralai/mistral-large',
      name: 'Mistral Large',
      description: 'Mistral\'s flagship model',
    },
    {
      id: 'cohere/command-r-plus',
      name: 'Command R+',
      description: 'Cohere\'s advanced model',
    },
  ];
}

export function clearModelCache(): void {
  try {
    localStorage.removeItem(MODEL_CACHE_KEY);
    log.debug('Cleared OpenRouter models cache');
  } catch (error) {
    log.warn('Failed to clear model cache', error);
  }
}
