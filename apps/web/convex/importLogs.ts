import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('importLogs').order('desc').take(50);
	},
});

export const create = mutation({
	args: {
		fileName: v.string(),
		rowsProcessed: v.number(),
		rowsImported: v.number(),
		rowsFailed: v.number(),
		errors: v.array(
			v.object({
				row: v.number(),
				message: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('importLogs', {
			...args,
			importedAt: Date.now(),
		});
	},
});
