import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('interactions').order('desc').take(100);
	},
});

export const create = mutation({
	args: {
		sessionId: v.string(),
		query: v.string(),
		aiModel: v.string(),
		usedFallback: v.boolean(),
		responseTimeMs: v.number(),
		promptTokens: v.optional(v.number()),
		completionTokens: v.optional(v.number()),
		totalTokens: v.optional(v.number()),
		promptVersion: v.optional(v.string()),
		filters: v.optional(
			v.object({
				color: v.optional(v.string()),
				sweetness: v.optional(v.string()),
				body: v.optional(v.string()),
				priceMin: v.optional(v.number()),
				priceMax: v.optional(v.number()),
				tastingNotes: v.optional(v.array(v.string())),
			})
		),
		recommendations: v.optional(
			v.array(
				v.object({
					wineId: v.string(),
					name: v.string(),
					producer: v.string(),
					price: v.number(),
					confidence: v.number(),
					reasoning: v.string(),
					provenanceTags: v.array(v.string()),
					scoreBreakdown: v.optional(
						v.object({
							baseScore: v.number(),
							marginBoost: v.number(),
							newArrivalBoost: v.number(),
							clearanceBoost: v.number(),
							finalScore: v.number(),
						})
					),
				})
			)
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('interactions', {
			...args,
			recommendations: args.recommendations ?? [],
			createdAt: Date.now(),
		});
	},
});

export const updateOutcome = mutation({
	args: {
		id: v.id('interactions'),
		outcome: v.union(
			v.literal('sold'),
			v.literal('declined'),
			v.literal('escalated'),
			v.literal('abandoned')
		),
		selectedWineId: v.optional(v.string()),
		feedback: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;
		await ctx.db.patch(id, fields);
	},
});
