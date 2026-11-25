import { describe, it, expect } from 'vitest'
import { createLiteLLMEnricher } from './src/utils/model-info/litellm.ts'

describe('Reproduction of user issue', () => {
  function enrich(modelInfo: Record<string, unknown>) {
    return createLiteLLMEnricher({ data: [{ model_name: 'test-model', model_info: modelInfo }] })
      .enrich({ id: 'test-model' }, { filterNonChat: true })
  }

  const mockData = {
    data: [
      {
        model_name: "gemma4-200k",
        litellm_params: {
          model: "ollama_chat/gemma4-200k:latest"
        },
        model_info: {
          mode: "chat",
          supports_vision: true,
          max_input_tokens: 204800,
          max_output_tokens: 16384
        }
      },
      {
        model_name: "qwen3-embedding",
        litellm_params: {
          model: "qwen3-embedding"
        },
        model_info: {
          mode: "embedding",
          max_input_tokens: 32768
        }
      }
    ]
  } as const;

  const enricher = createLiteLLMEnricher(mockData as any);

  it('should find gemma4-200k by model_name', () => {
    const result = enricher.enrich({ id: 'gemma4-200k' }, { filterNonChat: true });
    expect(result.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
  });

  it('should find gemma4-200k by litellm_params.model', () => {
    const result = enricher.enrich({ id: 'ollama_chat/gemma4-200k:latest' }, { filterNonChat: true });
    expect(result.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
  });

  it('should find gemma4-200k by the last part of litellm_params.model', () => {
    const result = enricher.enrich({ id: 'gemma4-200k:latest' }, { filterNonChat: true });
    expect(result.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
  });

  it('should return skip for qwen3-embedding when filterNonChat is true', () => {
    const result = enricher.enrich({ id: 'qwen3-embedding' }, { filterNonChat: true });
    expect(result).toEqual({ skip: true });
  });

  describe('raw array input (no data wrapper)', () => {
    it('should handle raw array directly', () => {
      const enricher2 = createLiteLLMEnricher([
        {
          model_name: 'raw-array-model',
          litellm_params: { model: 'ollama/raw' },
          model_info: { mode: 'chat', supports_vision: true, max_input_tokens: 32768 }
        }
      ] as any);
      
      const result = enricher2.enrich({ id: 'raw-array-model' }, { filterNonChat: true });
      expect(result.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
    });

    it('should handle single object with model_name', () => {
      const enricher3 = createLiteLLMEnricher({
        model_name: 'single-object-model',
        litellm_params: { model: 'ollama/single' },
        model_info: { mode: 'chat', supports_vision: true, max_input_tokens: 65536 }
      } as any);
      
      const result = enricher3.enrich({ id: 'single-object-model' }, { filterNonChat: true });
      expect(result.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
    });

    it('should handle empty array gracefully', () => {
      const enricher4 = createLiteLLMEnricher([] as any);
      const result = enricher4.enrich({ id: 'nonexistent' }, { filterNonChat: true });
      expect(result).toEqual({});
    });

    it('should handle null/undefined gracefully', () => {
      const enricher5 = createLiteLLMEnricher(null as any);
      const result = enricher5.enrich({ id: 'test' }, { filterNonChat: true });
      expect(result).toEqual({});
    });
  });
});
