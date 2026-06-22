import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('scoringRules').order('desc').collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		condition: v.object({
			field: v.string(),
			operator: v.union(
				v.literal('eq'),
				v.literal('lt'),
				v.literal('gt'),
				v.literal('lte'),
				v.literal('gte'),
				v.literal('in')
			),
			value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
		}),
		action: v.object({
			type: v.union(
				v.literal('adjust_score'),
				v.literal('filter_out'),
				v.literal('boost_priority')
			),
			target: v.union(
				v.literal('base_score'),
				v.literal('margin_boost'),
				v.literal('new_arrival_boost'),
				v.literal('clearance_boost')
			),
			value: v.number(),
		}),
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
		id: v.id('scoringRules'),
		name: v.optional(v.string()),
		condition: v.optional(
			v.object({
				field: v.string(),
				operator: v.union(
					v.literal('eq'),
					v.literal('lt'),
					v.literal('gt'),
					v.literal('lte'),
					v.literal('gte'),
					v.literal('in')
				),
				value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
			})
		),
		action: v.optional(
			v.object({
				type: v.union(
					v.literal('adjust_score'),
					v.literal('filter_out'),
					v.literal('boost_priority')
				),
				target: v.union(
					v.literal('base_score'),
					v.literal('margin_boost'),
					v.literal('new_arrival_boost'),
					v.literal('clearance_boost')
				),
				value: v.number(),
			})
		),
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
