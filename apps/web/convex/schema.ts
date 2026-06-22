import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	wines: defineTable({
		name: v.string(),
		producer: v.string(),
		country: v.optional(v.string()),
		region: v.optional(v.string()),
		grapeVariety: v.optional(v.string()),
		vintage: v.optional(v.number()),
		price: v.number(),
		stock: v.number(),
		costPrice: v.optional(v.number()),
		marginPercent: v.optional(v.number()),
		color: v.union(
			v.literal('red'),
			v.literal('white'),
			v.literal('rose'),
			v.literal('sparkling'),
			v.literal('fortified'),
			v.literal('spirit')
		),
		sweetness: v.optional(
			v.union(v.literal('dry'), v.literal('semi_dry'), v.literal('semi_sweet'), v.literal('sweet'))
		),
		body: v.optional(v.union(v.literal('light'), v.literal('medium'), v.literal('full'))),
		tastingNotes: v.array(v.string()),
		description: v.optional(v.string()),
		structuredDimensions: v.optional(
			v.object({
				dryness: v.number(),
				body: v.number(),
				acidity: v.number(),
				tannin: v.optional(v.number()),
			})
		),
		descriptionProvenance: v.union(
			v.literal('t1_producer'),
			v.literal('t2_inferred'),
			v.literal('t3_wordpress')
		),
		dimensionsProvenance: v.union(
			v.literal('t1_producer'),
			v.literal('t2_inferred'),
			v.literal('t3_wordpress')
		),
		producerUrl: v.optional(v.string()),
		producerDescription: v.optional(v.string()),
		isNewArrival: v.boolean(),
		isClearance: v.boolean(),
		isPriorityStock: v.boolean(),
		isPublished: v.boolean(),
		importedAt: v.number(),
		updatedAt: v.number(),
		descriptionEmbedding: v.optional(v.array(v.number())),
	})
		.index('by_price', ['price'])
		.index('by_stock', ['stock'])
		.index('by_color', ['color'])
		.index('by_producer', ['producer'])
		.index('by_producer_name', ['producer', 'name'])
		.index('by_flag', ['isNewArrival', 'isClearance', 'isPriorityStock'])
		.searchIndex('search_name', { searchField: 'name' })
		.searchIndex('search_producer', { searchField: 'producer' })
		.vectorIndex('vector_description', {
			vectorField: 'descriptionEmbedding',
			dimensions: 768,
			filterFields: ['color', 'isPublished'],
		}),

	scoringRules: defineTable({
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
		isActive: v.boolean(),
		createdAt: v.number(),
	})
		.index('by_priority', ['priority'])
		.index('by_active', ['isActive']),

	interactions: defineTable({
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
			})
		),
		recommendations: v.array(
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
		),
		selectedWineId: v.optional(v.string()),
		outcome: v.optional(
			v.union(
				v.literal('sold'),
				v.literal('declined'),
				v.literal('escalated'),
				v.literal('abandoned')
			)
		),
		feedback: v.optional(v.string()),
		aiModel: v.string(),
		usedFallback: v.boolean(),
		responseTimeMs: v.number(),
		promptTokens: v.optional(v.number()),
		completionTokens: v.optional(v.number()),
		totalTokens: v.optional(v.number()),
		promptVersion: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index('by_session', ['sessionId'])
		.index('by_date', ['createdAt'])
		.index('by_outcome', ['outcome']),

	wineFeedback: defineTable({
		wineId: v.id('wines'),
		feedback: v.string(),
		interactionId: v.optional(v.id('interactions')),
		createdAt: v.number(),
	})
		.index('by_wine', ['wineId'])
		.index('by_date', ['createdAt']),

	authState: defineTable({
		singleton: v.literal('AUTH'),
		pinHash: v.string(),
		lastAuthenticated: v.optional(v.number()),
		failedAttempts: v.number(),
		lockedUntil: v.optional(v.number()),
	}).index('by_singleton', ['singleton']),

	importLogs: defineTable({
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
		importedAt: v.number(),
	}).index('by_date', ['importedAt']),
});
