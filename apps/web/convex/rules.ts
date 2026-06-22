import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { SCORING_RULES_ACTION_VALIDATOR, SCORING_RULES_CONDITION_VALIDATOR } from './schema';
import { TABLES } from './tables';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('scoringRules').order('desc').collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		...SCORING_RULES_CONDITION_VALIDATOR,
		...SCORING_RULES_ACTION_VALIDATOR,
		priority: v.number(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('scoringRules', {
			...args,
			isActive: true,
			createdAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id(TABLES.SCORING_RULES),
		name: v.optional(v.string()),
		condition: v.optional(SCORING_RULES_CONDITION_VALIDATOR.condition),
		action: v.optional(SCORING_RULES_ACTION_VALIDATOR.action),
		priority: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;
		const defined = Object.fromEntries(
			Object.entries(fields).filter(([, val]) => val !== undefined)
		);
		await ctx.db.patch(id, defined);
	},
});

export const toggle = mutation({
	args: { id: v.id('scoringRules'), isActive: v.boolean() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { isActive: args.isActive });
	},
});

export const remove = mutation({
	args: { id: v.id('scoringRules') },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});
