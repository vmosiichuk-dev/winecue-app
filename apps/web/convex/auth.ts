import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const get = query({
	args: {},
	handler: async (ctx) => {
		const state = await ctx.db
			.query('authState')
			.withIndex('by_singleton', (q) => q.eq('singleton', 'AUTH'))
			.unique();
		return state ?? null;
	},
});

export const upsert = mutation({
	args: {
		pinHash: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('authState')
			.withIndex('by_singleton', (q) => q.eq('singleton', 'AUTH'))
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				pinHash: args.pinHash,
				lastAuthenticated: Date.now(),
				failedAttempts: 0,
				lockedUntil: undefined,
			});
			return existing._id;
		}
		return await ctx.db.insert('authState', {
			singleton: 'AUTH',
			pinHash: args.pinHash,
			failedAttempts: 0,
		});
	},
});

export const verify = mutation({
	args: {
		pinHash: v.string(),
	},
	handler: async (ctx, args) => {
		const state = await ctx.db
			.query('authState')
			.withIndex('by_singleton', (q) => q.eq('singleton', 'AUTH'))
			.unique();
		if (!state) {
			return { success: false as const, error: 'NOT_CONFIGURED' as const };
		}

		const now = Date.now();
		if (state.lockedUntil && state.lockedUntil > now) {
			return {
				success: false as const,
				error: 'ACCOUNT_LOCKED' as const,
				lockedUntil: state.lockedUntil,
			};
		}

		if (state.pinHash !== args.pinHash) {
			const newFailedAttempts = state.failedAttempts + 1;
			const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
			await ctx.db.patch(state._id, {
				failedAttempts: newFailedAttempts,
				lockedUntil: shouldLock ? now + LOCKOUT_DURATION_MS : undefined,
			});
			return {
				success: false as const,
				error: shouldLock ? ('ACCOUNT_LOCKED' as const) : ('INVALID_PIN' as const),
				lockedUntil: shouldLock ? now + LOCKOUT_DURATION_MS : undefined,
			};
		}

		await ctx.db.patch(state._id, {
			failedAttempts: 0,
			lastAuthenticated: now,
			lockedUntil: undefined,
		});
		return { success: true as const };
	},
});
