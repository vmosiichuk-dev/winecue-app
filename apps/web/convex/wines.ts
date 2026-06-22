import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('wines').collect();
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
		color: v.optional(
			v.union(
				v.literal('red'),
				v.literal('white'),
				v.literal('rose'),
				v.literal('sparkling'),
				v.literal('fortified'),
				v.literal('spirit')
			)
		),
		inStock: v.optional(v.boolean()),
		minPrice: v.optional(v.number()),
		maxPrice: v.optional(v.number()),
		searchName: v.optional(v.string()),
		searchProducer: v.optional(v.string()),
		sortBy: v.optional(
			v.union(v.literal('price'), v.literal('name'), v.literal('stock'), v.literal('createdAt'))
		),
		sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const sortOrder = args.sortOrder ?? 'asc';

		let results = await ctx.db.query('wines').collect();

		if (args.color) {
			results = results.filter((w) => w.color === args.color);
		}
		const { searchName, searchProducer, inStock, minPrice, maxPrice } = args;

		if (searchName) {
			results = results.filter((w) => w.name.toLowerCase().includes(searchName.toLowerCase()));
		}
		if (searchProducer) {
			results = results.filter((w) =>
				w.producer.toLowerCase().includes(searchProducer.toLowerCase())
			);
		}
		if (inStock !== undefined) {
			results = results.filter((w) => (inStock ? w.stock > 0 : w.stock === 0));
		}
		if (minPrice !== undefined) {
			results = results.filter((w) => w.price >= minPrice);
		}
		if (maxPrice !== undefined) {
			results = results.filter((w) => w.price <= maxPrice);
		}

		if (args.sortBy === 'name') {
			results.sort((a, b) => a.name.localeCompare(b.name));
		} else if (args.sortBy === 'price') {
			results.sort((a, b) => a.price - b.price);
		} else if (args.sortBy === 'stock') {
			results.sort((a, b) => a.stock - b.stock);
		} else if (args.sortBy === 'createdAt') {
			results.sort((a, b) => a.importedAt - b.importedAt);
		}

		if (sortOrder === 'desc') {
			results.reverse();
		}

		const hasMore = results.length > limit;
		const page = results.slice(0, limit);

		return {
			wines: page,
			hasMore,
			totalCount: results.length,
		};
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		producer: v.string(),
		price: v.number(),
		stock: v.number(),
		color: v.union(
			v.literal('red'),
			v.literal('white'),
			v.literal('rose'),
			v.literal('sparkling'),
			v.literal('fortified'),
			v.literal('spirit')
		),
		country: v.optional(v.string()),
		region: v.optional(v.string()),
		grapeVariety: v.optional(v.string()),
		vintage: v.optional(v.number()),
		costPrice: v.optional(v.number()),
		marginPercent: v.optional(v.number()),
		sweetness: v.optional(
			v.union(v.literal('dry'), v.literal('semi_dry'), v.literal('semi_sweet'), v.literal('sweet'))
		),
		body: v.optional(v.union(v.literal('light'), v.literal('medium'), v.literal('full'))),
		tastingNotes: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
		structuredDimensions: v.optional(
			v.object({
				dryness: v.number(),
				body: v.number(),
				acidity: v.number(),
				tannin: v.optional(v.number()),
			})
		),
		descriptionProvenance: v.optional(
			v.union(v.literal('t1_producer'), v.literal('t2_inferred'), v.literal('t3_wordpress'))
		),
		dimensionsProvenance: v.optional(
			v.union(v.literal('t1_producer'), v.literal('t2_inferred'), v.literal('t3_wordpress'))
		),
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
		id: v.id('wines'),
		name: v.optional(v.string()),
		producer: v.optional(v.string()),
		price: v.optional(v.number()),
		stock: v.optional(v.number()),
		color: v.optional(
			v.union(
				v.literal('red'),
				v.literal('white'),
				v.literal('rose'),
				v.literal('sparkling'),
				v.literal('fortified'),
				v.literal('spirit')
			)
		),
		country: v.optional(v.string()),
		region: v.optional(v.string()),
		grapeVariety: v.optional(v.string()),
		vintage: v.optional(v.number()),
		costPrice: v.optional(v.number()),
		marginPercent: v.optional(v.number()),
		sweetness: v.optional(
			v.union(v.literal('dry'), v.literal('semi_dry'), v.literal('semi_sweet'), v.literal('sweet'))
		),
		body: v.optional(v.union(v.literal('light'), v.literal('medium'), v.literal('full'))),
		tastingNotes: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
		structuredDimensions: v.optional(
			v.object({
				dryness: v.number(),
				body: v.number(),
				acidity: v.number(),
				tannin: v.optional(v.number()),
			})
		),
		descriptionProvenance: v.optional(
			v.union(v.literal('t1_producer'), v.literal('t2_inferred'), v.literal('t3_wordpress'))
		),
		dimensionsProvenance: v.optional(
			v.union(v.literal('t1_producer'), v.literal('t2_inferred'), v.literal('t3_wordpress'))
		),
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
				color: v.union(
					v.literal('red'),
					v.literal('white'),
					v.literal('rose'),
					v.literal('sparkling'),
					v.literal('fortified'),
					v.literal('spirit')
				),
				country: v.optional(v.string()),
				region: v.optional(v.string()),
				grapeVariety: v.optional(v.string()),
				vintage: v.optional(v.number()),
				costPrice: v.optional(v.number()),
				sweetness: v.optional(
					v.union(
						v.literal('dry'),
						v.literal('semi_dry'),
						v.literal('semi_sweet'),
						v.literal('sweet')
					)
				),
				body: v.optional(v.union(v.literal('light'), v.literal('medium'), v.literal('full'))),
				tastingNotes: v.optional(v.array(v.string())),
				description: v.optional(v.string()),
				structuredDimensions: v.optional(
					v.object({
						dryness: v.number(),
						body: v.number(),
						acidity: v.number(),
						tannin: v.optional(v.number()),
					})
				),
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
		const ids = [];
		for (const wine of args.wines) {
			const existing = await ctx.db
				.query('wines')
				.withIndex('by_producer', (q) => q.eq('producer', wine.producer))
				.filter((q) => q.eq(q.field('name'), wine.name))
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, {
					...wine,
					tastingNotes: wine.tastingNotes ?? existing.tastingNotes,
					updatedAt: now,
				});
				ids.push(existing._id);
			} else {
				const id = await ctx.db.insert('wines', {
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
				ids.push(id);
			}
		}
		return ids;
	},
});
