import { AIResponseSchema, CompareResponseSchema } from '@winecue/shared-types';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { action } from './_generated/server';
import { DEFAULT_TEXT_MODEL, GeminiClient } from './lib/gemini.js';
import { buildCompareMessages } from './lib/prompts/compare.js';
import { buildRecommendMessages } from './lib/prompts/recommend.js';

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
				excludeWineIds: v.optional(v.array(v.string())),
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
			excludeWineIds: excludeWineIds?.map((id) => id as unknown as Id<'wines'>) ?? [],
		});

		const topCandidates = candidates
			.sort((a: Doc<'wines'>, b: Doc<'wines'>) => {
				const marginA = a.marginPercent ?? 0;
				const marginB = b.marginPercent ?? 0;
				if (marginA !== marginB) return marginB - marginA;
				if (a.isPriorityStock !== b.isPriorityStock) return a.isPriorityStock ? -1 : 1;
				return b.stock - a.stock;
			})
			.slice(0, 20);

		const client = new GeminiClient(apiKey);
		const messages = buildRecommendMessages({
			query: args.query,
			filters: args.filters,
			candidates: topCandidates.map((w: Doc<'wines'>) => ({
				id: w._id,
				name: w.name,
				producer: w.producer,
				price: w.price,
				marginPercent: w.marginPercent,
				color: w.color,
				sweetness: w.sweetness,
				body: w.body,
				grapeVariety: w.grapeVariety,
				vintage: w.vintage,
				region: w.region,
				tastingNotes: w.tastingNotes,
				description: w.description,
				structuredDimensions: w.structuredDimensions,
			})),
		});

		const result = await client.generateStructured(messages, AIResponseSchema, 0.3);

		const responseTimeMs = Date.now() - startTime;

		const scoredWines = topCandidates.map((wine: Doc<'wines'>) => {
			const aiMatch = result.data.wines.find((w) => w.wineId === wine._id);
			return {
				wine,
				aiConfidence: aiMatch?.confidence ?? 0,
				reasoning: aiMatch?.reasoning ?? '',
			};
		});

		scoredWines.sort((a, b) => b.aiConfidence - a.aiConfidence);

		const recommendations = scoredWines
			.filter((s) => s.aiConfidence > 0)
			.slice(0, 4)
			.map((s) => ({
				wineId: s.wine._id,
				name: s.wine.name,
				producer: s.wine.producer,
				price: s.wine.price,
				confidence: s.aiConfidence,
				reasoning: s.reasoning,
				provenanceTags: [s.wine.descriptionProvenance, s.wine.dimensionsProvenance],
			}));

		await ctx.runMutation(api.interactions.create, {
			sessionId: args.sessionId,
			query: args.query,
			aiModel: DEFAULT_TEXT_MODEL,
			usedFallback: false,
			responseTimeMs,
			promptTokens: result.usage.promptTokens,
			completionTokens: result.usage.completionTokens,
			totalTokens: result.usage.totalTokens,
			promptVersion: 'recommend-v1',
			filters: args.filters
				? {
						color: args.filters.color,
						sweetness: args.filters.sweetness,
						body: args.filters.body,
						priceMin: args.filters.priceMin,
						priceMax: args.filters.priceMax,
						tastingNotes: args.filters.tastingNotes,
					}
				: undefined,
			recommendations,
		});

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
			wineA: {
				id: wineA._id,
				name: wineA.name,
				producer: wineA.producer,
				price: wineA.price,
				color: wineA.color,
				grapeVariety: wineA.grapeVariety,
				vintage: wineA.vintage,
				region: wineA.region,
				country: wineA.country,
				sweetness: wineA.sweetness,
				body: wineA.body,
				tastingNotes: wineA.tastingNotes,
				description: wineA.description,
				structuredDimensions: wineA.structuredDimensions,
				provenanceTags: [wineA.descriptionProvenance, wineA.dimensionsProvenance],
			},
			wineB: {
				id: wineB._id,
				name: wineB.name,
				producer: wineB.producer,
				price: wineB.price,
				color: wineB.color,
				grapeVariety: wineB.grapeVariety,
				vintage: wineB.vintage,
				region: wineB.region,
				country: wineB.country,
				sweetness: wineB.sweetness,
				body: wineB.body,
				tastingNotes: wineB.tastingNotes,
				description: wineB.description,
				structuredDimensions: wineB.structuredDimensions,
				provenanceTags: [wineB.descriptionProvenance, wineB.dimensionsProvenance],
			},
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
