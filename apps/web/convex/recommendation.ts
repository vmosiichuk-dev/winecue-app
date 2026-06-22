import type { AIResponse } from '@winecue/shared-types';
import { AIResponseSchema, CompareResponseSchema } from '@winecue/shared-types';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { action } from './_generated/server';
import { DEFAULT_TEXT_MODEL, GeminiClient } from './lib/gemini.js';
import { buildCompareMessages } from './lib/prompts/compare.js';
import { buildRecommendMessages } from './lib/prompts/recommend.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rankCandidates(candidates: Doc<'wines'>[]): Doc<'wines'>[] {
	return [...candidates].sort((a, b) => {
		const marginA = a.marginPercent ?? 0;
		const marginB = b.marginPercent ?? 0;
		if (marginA !== marginB) return marginB - marginA;
		if (a.isPriorityStock !== b.isPriorityStock) return a.isPriorityStock ? -1 : 1;
		return b.stock - a.stock;
	});
}

function toPromptWine(wine: Doc<'wines'>) {
	return {
		id: wine._id,
		name: wine.name,
		producer: wine.producer,
		price: wine.price,
		marginPercent: wine.marginPercent,
		color: wine.color,
		sweetness: wine.sweetness,
		body: wine.body,
		grapeVariety: wine.grapeVariety,
		vintage: wine.vintage,
		region: wine.region,
		tastingNotes: wine.tastingNotes,
		description: wine.description,
		structuredDimensions: wine.structuredDimensions,
	};
}

type Recommendation = {
	wineId: string;
	name: string;
	producer: string;
	price: number;
	confidence: number;
	reasoning: string;
	provenanceTags: string[];
};

function buildRecommendations(
	topCandidates: Doc<'wines'>[],
	aiWines: AIResponse['wines']
): Recommendation[] {
	const scoredWines = topCandidates.map((wine) => {
		const aiMatch = aiWines.find((w) => w.wineId === wine._id);
		return {
			wine,
			aiConfidence: aiMatch?.confidence ?? 0,
			reasoning: aiMatch?.reasoning ?? '',
		};
	});

	scoredWines.sort((a, b) => b.aiConfidence - a.aiConfidence);

	return scoredWines
		.filter((s) => s.aiConfidence > 0)
		.slice(0, 4)
		.map((s) => ({
			wineId: s.wine._id,
			name: s.wine.name,
			producer: s.wine.producer,
			price: s.wine.price,
			confidence: s.aiConfidence,
			reasoning: s.reasoning,
			provenanceTags: [s.wine.descriptionProvenance, s.wine.dimensionsProvenance].filter(
				Boolean as unknown as (x: string | undefined) => x is string
			),
		}));
}

function buildInteractionPayload(
	sessionId: string,
	query: string,
	filters:
		| {
				color?: string;
				sweetness?: string;
				body?: string;
				priceMin?: number;
				priceMax?: number;
				tastingNotes?: string[];
				excludeWineIds?: Id<'wines'>[];
		  }
		| undefined,
	recommendations: Recommendation[],
	result: {
		data: { queryInterpretation: unknown };
		usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
	},
	responseTimeMs: number
) {
	return {
		sessionId,
		query,
		aiModel: DEFAULT_TEXT_MODEL,
		usedFallback: false,
		responseTimeMs,
		promptTokens: result.usage.promptTokens,
		completionTokens: result.usage.completionTokens,
		totalTokens: result.usage.totalTokens,
		promptVersion: 'recommend-v1',
		filters: filters
			? {
					color: filters.color,
					sweetness: filters.sweetness,
					body: filters.body,
					priceMin: filters.priceMin,
					priceMax: filters.priceMax,
					tastingNotes: filters.tastingNotes,
				}
			: undefined,
		recommendations,
	};
}

function toCompareWine(wine: Doc<'wines'>) {
	return {
		id: wine._id,
		name: wine.name,
		producer: wine.producer,
		price: wine.price,
		color: wine.color,
		grapeVariety: wine.grapeVariety,
		vintage: wine.vintage,
		region: wine.region,
		country: wine.country,
		sweetness: wine.sweetness,
		body: wine.body,
		tastingNotes: wine.tastingNotes,
		description: wine.description,
		structuredDimensions: wine.structuredDimensions,
		provenanceTags: [wine.descriptionProvenance, wine.dimensionsProvenance].filter(
			Boolean as unknown as (x: string | undefined) => x is string
		),
	};
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const recommend = action({
	args: {
		sessionId: v.string(),
		query: v.string(),
		filters: v.optional(
			v.object({
				color: v.optional(v.string()),
				sweetness: v.optional(v.string()),
				body: v.optional(v.string()),
				priceMin: v.optional(v.number()),
				priceMax: v.optional(v.number()),
				tastingNotes: v.optional(v.array(v.string())),
				excludeWineIds: v.optional(v.array(v.id('wines'))),
			})
		),
	},
	handler: async (ctx, args) => {
		const startTime = Date.now();
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY not configured');
		}

		const { color, priceMin, priceMax, excludeWineIds } = args.filters ?? {};

		const candidates: Doc<'wines'>[] = await ctx.runQuery(api.wines.list, {
			isPublished: true,
			inStock: true,
			color,
			priceMin,
			priceMax,
			excludeWineIds: excludeWineIds ?? [],
		});

		const topCandidates = rankCandidates(candidates).slice(0, 20);

		const client = new GeminiClient(apiKey);
		const messages = buildRecommendMessages({
			query: args.query,
			filters: args.filters,
			candidates: topCandidates.map(toPromptWine),
		});

		const result = await client.generateStructured(messages, AIResponseSchema, 0.3);
		const responseTimeMs = Date.now() - startTime;

		const recommendations = buildRecommendations(topCandidates, result.data.wines);

		await ctx.runMutation(
			api.interactions.create,
			buildInteractionPayload(
				args.sessionId,
				args.query,
				args.filters,
				recommendations,
				result,
				responseTimeMs
			)
		);

		return {
			success: true as const,
			mainContenders: recommendations.slice(0, 2),
			alternatives: recommendations.slice(2, 4),
			queryInterpretation: result.data.queryInterpretation,
			usedFallback: false,
			responseTimeMs,
		};
	},
});

export const compare = action({
	args: {
		wineAId: v.id('wines'),
		wineBId: v.id('wines'),
		sessionContext: v.optional(
			v.object({
				sessionId: v.string(),
				customerQuery: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		const startTime = Date.now();
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY not configured');
		}

		const wineA: Doc<'wines'> | null = await ctx.runQuery(api.wines.getById, { id: args.wineAId });
		const wineB: Doc<'wines'> | null = await ctx.runQuery(api.wines.getById, { id: args.wineBId });

		if (!wineA || !wineB) {
			throw new Error('One or both wines not found');
		}

		const client = new GeminiClient(apiKey);
		const messages = buildCompareMessages({
			wineA: toCompareWine(wineA),
			wineB: toCompareWine(wineB),
			customerQuery: args.sessionContext?.customerQuery,
		});

		const compareSchema = CompareResponseSchema.omit({
			success: true,
			usedFallback: true,
			responseTimeMs: true,
		});

		const result = await client.generateStructured(messages, compareSchema, 0.4);
		const responseTimeMs = Date.now() - startTime;

		return {
			success: true as const,
			...result.data,
			usedFallback: false,
			responseTimeMs,
		};
	},
});
