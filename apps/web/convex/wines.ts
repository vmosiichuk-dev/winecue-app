import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import {
	WINES_BODY_VALIDATOR,
	WINES_COLOR_VALIDATOR,
	WINES_PROVENANCE_VALIDATOR,
	WINES_STRUCTURED_DIMENSIONS_VALIDATOR,
	WINES_SWEETNESS_VALIDATOR,
} from './schema';
import { TABLES } from './tables';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BulkWineInput = {
	name: string;
	producer: string;
	price: number;
	stock: number;
	color: string;
	country?: string;
	region?: string;
	grapeVariety?: string;
	vintage?: number;
	costPrice?: number;
	marginPercent?: number;
	sweetness?: string;
	body?: string;
	tastingNotes?: string[];
	description?: string;
	structuredDimensions?: {
		dryness: number;
		body: number;
		acidity: number;
		tannin?: number;
	};
	producerUrl?: string;
	producerDescription?: string;
	isNewArrival?: boolean;
	isClearance?: boolean;
	isPriorityStock?: boolean;
};

type WineFetchArgs = {
	color?: string;
	priceMin?: number;
	priceMax?: number;
	minPrice?: number;
	maxPrice?: number;
};

type WinePredicate = (w: Doc<'wines'>) => boolean;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const WINE_SORTERS: Record<string, (a: Doc<'wines'>, b: Doc<'wines'>) => number> = {
	name: (a, b) => a.name.localeCompare(b.name),
	price: (a, b) => a.price - b.price,
	stock: (a, b) => a.stock - b.stock,
	importedAt: (a, b) => a.importedAt - b.importedAt,
};

async function fetchWines(ctx: QueryCtx, args: WineFetchArgs): Promise<Doc<'wines'>[]> {
	const color = args.color;
	if (color) {
		return ctx.db
			.query('wines')
			.withIndex('by_color', (q) => q.eq('color', color))
			.collect();
	}

	const min = args.priceMin ?? args.minPrice;
	const max = args.priceMax ?? args.maxPrice;

	if (min !== undefined || max !== undefined) {
		return ctx.db
			.query('wines')
			.withIndex('by_price', (q: any) => {
				let range = q;
				if (min !== undefined) range = range.gte('price', min);
				if (max !== undefined) range = range.lte('price', max);
				return range;
			})
			.collect();
	}

	return ctx.db.query('wines').collect();
}

async function upsertOneWine(
	ctx: MutationCtx,
	wine: BulkWineInput,
	now: number
): Promise<Id<'wines'>> {
	const existing = await ctx.db
		.query('wines')
		.withIndex('by_producer_name', (q) => q.eq('producer', wine.producer).eq('name', wine.name))
		.unique();

	if (existing) {
		await ctx.db.patch(existing._id, {
			...wine,
			tastingNotes: wine.tastingNotes ?? existing.tastingNotes,
			updatedAt: now,
		});
		return existing._id;
	}

	return await ctx.db.insert('wines', {
		...wine,
		tastingNotes: wine.tastingNotes ?? [],
		descriptionProvenance: 't2_inferred',
		dimensionsProvenance: 't2_inferred',
		isNewArrival: wine.isNewArrival ?? false,
		isClearance: wine.isClearance ?? false,
		isPriorityStock: wine.isPriorityStock ?? false,
		isPublished: true,
		importedAt: now,
		updatedAt: now,
	});
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const list = query({
	args: {
		isPublished: v.optional(v.boolean()),
		inStock: v.optional(v.boolean()),
		color: v.optional(v.string()),
		priceMin: v.optional(v.number()),
		priceMax: v.optional(v.number()),
		excludeWineIds: v.optional(v.array(v.id('wines'))),
	},
	handler: async (ctx, args) => {
		const { color, priceMin, priceMax, excludeWineIds, isPublished, inStock } = args;

		const results = await fetchWines(ctx, { color, priceMin, priceMax });

		const predicates: WinePredicate[] = [];
		if (isPublished !== undefined) {
			predicates.push((w) => w.isPublished === isPublished);
		}
		if (inStock !== undefined) {
			predicates.push((w) => (inStock ? w.stock > 0 : w.stock === 0));
		}
		if (color === undefined && priceMin !== undefined) {
			predicates.push((w) => w.price >= priceMin);
		}
		if (color === undefined && priceMax !== undefined) {
			predicates.push((w) => w.price <= priceMax);
		}
		if (excludeWineIds !== undefined && excludeWineIds.length > 0) {
			predicates.push((w) => !excludeWineIds.includes(w._id));
		}

		return results.filter((w) => predicates.every((p) => p(w)));
	},
});

export const getById = query({
	args: { id: v.id('wines') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const search = query({
	args: {
		color: v.optional(WINES_COLOR_VALIDATOR.color),
		inStock: v.optional(v.boolean()),
		minPrice: v.optional(v.number()),
		maxPrice: v.optional(v.number()),
		searchName: v.optional(v.string()),
		searchProducer: v.optional(v.string()),
		sortBy: v.optional(
			v.union(v.literal('price'), v.literal('name'), v.literal('stock'), v.literal('importedAt'))
		),
		sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const sortOrder = args.sortOrder ?? 'asc';
		const { searchName, searchProducer, inStock, minPrice, maxPrice, color } = args;

		const results = await fetchWines(ctx, { color, minPrice, maxPrice });

		const predicates: WinePredicate[] = [];
		if (searchName) {
			predicates.push((w) => w.name.toLowerCase().includes(searchName.toLowerCase()));
		}
		if (searchProducer) {
			predicates.push((w) => w.producer.toLowerCase().includes(searchProducer.toLowerCase()));
		}
		if (inStock !== undefined) {
			predicates.push((w) => (inStock ? w.stock > 0 : w.stock === 0));
		}
		if (color === undefined && minPrice !== undefined) {
			predicates.push((w) => w.price >= minPrice);
		}
		if (color === undefined && maxPrice !== undefined) {
			predicates.push((w) => w.price <= maxPrice);
		}

		let sorted = results.filter((w) => predicates.every((p) => p(w)));

		if (args.sortBy && args.sortBy in WINE_SORTERS) {
			sorted.sort(WINE_SORTERS[args.sortBy]);
		}
		if (sortOrder === 'desc') {
			sorted = sorted.slice().reverse();
		}

		const hasMore = sorted.length > limit;
		const page = sorted.slice(0, limit);

		return {
			wines: page,
			hasMore,
			totalCount: sorted.length,
		};
	},
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
	args: {
		name: v.string(),
		producer: v.string(),
		price: v.number(),
		stock: v.number(),
		...WINES_COLOR_VALIDATOR,
		country: v.optional(v.string()),
		region: v.optional(v.string()),
		grapeVariety: v.optional(v.string()),
		vintage: v.optional(v.number()),
		costPrice: v.optional(v.number()),
		marginPercent: v.optional(v.number()),
		...WINES_SWEETNESS_VALIDATOR,
		...WINES_BODY_VALIDATOR,
		tastingNotes: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
		...WINES_STRUCTURED_DIMENSIONS_VALIDATOR,
		descriptionProvenance: v.optional(WINES_PROVENANCE_VALIDATOR.descriptionProvenance),
		dimensionsProvenance: v.optional(WINES_PROVENANCE_VALIDATOR.dimensionsProvenance),
		producerUrl: v.optional(v.string()),
		producerDescription: v.optional(v.string()),
		isNewArrival: v.optional(v.boolean()),
		isClearance: v.optional(v.boolean()),
		isPriorityStock: v.optional(v.boolean()),
		isPublished: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('wines', {
			...args,
			tastingNotes: args.tastingNotes ?? [],
			descriptionProvenance: args.descriptionProvenance ?? 't2_inferred',
			dimensionsProvenance: args.dimensionsProvenance ?? 't2_inferred',
			isNewArrival: args.isNewArrival ?? false,
			isClearance: args.isClearance ?? false,
			isPriorityStock: args.isPriorityStock ?? false,
			isPublished: args.isPublished ?? true,
			importedAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id(TABLES.WINES),
		name: v.optional(v.string()),
		producer: v.optional(v.string()),
		price: v.optional(v.number()),
		stock: v.optional(v.number()),
		color: v.optional(WINES_COLOR_VALIDATOR.color),
		country: v.optional(v.string()),
		region: v.optional(v.string()),
		grapeVariety: v.optional(v.string()),
		vintage: v.optional(v.number()),
		costPrice: v.optional(v.number()),
		marginPercent: v.optional(v.number()),
		sweetness: v.optional(WINES_SWEETNESS_VALIDATOR.sweetness),
		body: v.optional(WINES_BODY_VALIDATOR.body),
		tastingNotes: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
		structuredDimensions: v.optional(WINES_STRUCTURED_DIMENSIONS_VALIDATOR.structuredDimensions),
		descriptionProvenance: v.optional(WINES_PROVENANCE_VALIDATOR.descriptionProvenance),
		dimensionsProvenance: v.optional(WINES_PROVENANCE_VALIDATOR.dimensionsProvenance),
		producerUrl: v.optional(v.string()),
		producerDescription: v.optional(v.string()),
		isNewArrival: v.optional(v.boolean()),
		isClearance: v.optional(v.boolean()),
		isPriorityStock: v.optional(v.boolean()),
		isPublished: v.optional(v.boolean()),
		descriptionEmbedding: v.optional(v.array(v.number())),
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;
		const defined = Object.fromEntries(
			Object.entries(fields).filter(([, val]) => val !== undefined)
		);
		await ctx.db.patch(id, { ...defined, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id('wines') },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});

export const bulkUpsert = mutation({
	args: {
		wines: v.array(
			v.object({
				name: v.string(),
				producer: v.string(),
				price: v.number(),
				stock: v.number(),
				...WINES_COLOR_VALIDATOR,
				country: v.optional(v.string()),
				region: v.optional(v.string()),
				grapeVariety: v.optional(v.string()),
				vintage: v.optional(v.number()),
				costPrice: v.optional(v.number()),
				marginPercent: v.optional(v.number()),
				...WINES_SWEETNESS_VALIDATOR,
				...WINES_BODY_VALIDATOR,
				tastingNotes: v.optional(v.array(v.string())),
				description: v.optional(v.string()),
				...WINES_STRUCTURED_DIMENSIONS_VALIDATOR,
				producerUrl: v.optional(v.string()),
				producerDescription: v.optional(v.string()),
				isNewArrival: v.optional(v.boolean()),
				isClearance: v.optional(v.boolean()),
				isPriorityStock: v.optional(v.boolean()),
			})
		),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const ids: Id<'wines'>[] = [];
		for (const wine of args.wines) {
			ids.push(await upsertOneWine(ctx, wine, now));
		}
		return ids;
	},
});
