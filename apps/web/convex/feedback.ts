import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const listByWine = query({
	args: { wineId: v.id('wines') },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('wineFeedback')
			.withIndex('by_wine', (q) => q.eq('wineId', args.wineId))
			.order('desc')
			.collect();
	},
});

export const create = mutation({
	args: {
		wineId: v.id('wines'),
		feedback: v.string(),
		interactionId: v.optional(v.id('interactions')),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('wineFeedback', {
			...args,
			createdAt: Date.now(),
		});
	},
});
