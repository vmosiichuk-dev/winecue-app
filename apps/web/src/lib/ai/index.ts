export { GeminiClient } from './gemini.js';
export { buildCompareMessages } from './prompts/compare.js';
export { buildRecommendMessages } from './prompts/recommend.js';
export type {
	AIClient,
	GenerateStructuredResult,
	GenerateTextResult,
	GenerationUsage,
	Message,
	StreamChunk,
} from './types.js';
