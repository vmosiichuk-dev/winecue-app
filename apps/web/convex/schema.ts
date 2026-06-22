import {
	DATA_PROVENANCE,
	INTERACTION_OUTCOME,
	RULE_ACTION_TYPE,
	RULE_OPERATOR,
	RULE_TARGET,
	WINE_BODY,
	WINE_COLOR,
	WINE_SWEETNESS,
} from '@winecue/shared-types';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { convexUnionFromConst } from './helpers';
import { INDEX_BY, TABLES } from './tables';

// WINES fragments
export const WINES_COLOR_VALIDATOR = { color: convexUnionFromConst(WINE_COLOR) };

export const WINES_SWEETNESS_VALIDATOR = {
	sweetness: v.optional(convexUnionFromConst(WINE_SWEETNESS)),
};

export const WINES_BODY_VALIDATOR = { body: v.optional(convexUnionFromConst(WINE_BODY)) };

export const WINES_PROVENANCE_VALIDATOR = {
	descriptionProvenance: convexUnionFromConst(DATA_PROVENANCE),
	dimensionsProvenance: convexUnionFromConst(DATA_PROVENANCE),
};

export const WINES_STRUCTURED_DIMENSIONS_VALIDATOR = {
	structuredDimensions: v.optional(
		v.object({
			dryness: v.number(),
			body: v.number(),
			acidity: v.number(),
			tannin: v.optional(v.number()),
		})
	),
};

export const WINES_VALIDATOR = {
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
	...WINES_COLOR_VALIDATOR,
	...WINES_SWEETNESS_VALIDATOR,
	...WINES_BODY_VALIDATOR,
	tastingNotes: v.array(v.string()),
	description: v.optional(v.string()),
	...WINES_STRUCTURED_DIMENSIONS_VALIDATOR,
	...WINES_PROVENANCE_VALIDATOR,
	producerUrl: v.optional(v.string()),
	producerDescription: v.optional(v.string()),
	isNewArrival: v.boolean(),
	isClearance: v.boolean(),
	isPriorityStock: v.boolean(),
	isPublished: v.boolean(),
	importedAt: v.number(),
	updatedAt: v.number(),
	descriptionEmbedding: v.optional(v.array(v.number())),
};

// SCORING RULES fragments
export const SCORING_RULES_CONDITION_VALIDATOR = {
	condition: v.object({
		field: v.string(),
		operator: convexUnionFromConst(RULE_OPERATOR),
		value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
	}),
};

export const SCORING_RULES_ACTION_VALIDATOR = {
	action: v.object({
		type: convexUnionFromConst(RULE_ACTION_TYPE),
		target: convexUnionFromConst(RULE_TARGET),
		value: v.number(),
	}),
};

export const SCORING_RULES_VALIDATOR = {
	name: v.string(),
	...SCORING_RULES_CONDITION_VALIDATOR,
	...SCORING_RULES_ACTION_VALIDATOR,
	priority: v.number(),
	isActive: v.boolean(),
	createdAt: v.number(),
};

// INTERACTIONS fragments
export const INTERACTIONS_FILTERS_VALIDATOR = {
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
};

export const INTERACTIONS_RECOMMENDATION_VALIDATOR = {
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
};

export const INTERACTIONS_OUTCOME_VALIDATOR = {
	outcome: v.optional(convexUnionFromConst(INTERACTION_OUTCOME)),
};

export const INTERACTIONS_VALIDATOR = {
	sessionId: v.string(),
	query: v.string(),
	...INTERACTIONS_FILTERS_VALIDATOR,
	...INTERACTIONS_RECOMMENDATION_VALIDATOR,
	selectedWineId: v.optional(v.string()),
	...INTERACTIONS_OUTCOME_VALIDATOR,
	feedback: v.optional(v.string()),
	aiModel: v.string(),
	usedFallback: v.boolean(),
	responseTimeMs: v.number(),
	promptTokens: v.optional(v.number()),
	completionTokens: v.optional(v.number()),
	totalTokens: v.optional(v.number()),
	promptVersion: v.optional(v.string()),
	createdAt: v.number(),
};

// WINE FEEDBACK fragments
export const WINE_FEEDBACK_VALIDATOR = {
	wineId: v.id(TABLES.WINES),
	feedback: v.string(),
	interactionId: v.optional(v.id(TABLES.INTERACTIONS)),
	createdAt: v.number(),
};

// AUTH STATE fragments
export const AUTH_STATE_VALIDATOR = {
	singleton: v.literal('AUTH'),
	pinHash: v.string(),
	lastAuthenticated: v.optional(v.number()),
	failedAttempts: v.number(),
	lockedUntil: v.optional(v.number()),
};

// IMPORT LOGS fragments
export const IMPORT_LOGS_VALIDATOR = {
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
};

export default defineSchema({
	[TABLES.WINES]: defineTable(WINES_VALIDATOR)
		.index(INDEX_BY.WINE_PRICE.name, [INDEX_BY.WINE_PRICE.field])
		.index(INDEX_BY.WINE_STOCK.name, [INDEX_BY.WINE_STOCK.field])
		.index(INDEX_BY.WINE_COLOR.name, [INDEX_BY.WINE_COLOR.field])
		.index(INDEX_BY.WINE_PRODUCER.name, [INDEX_BY.WINE_PRODUCER.field])
		.index(INDEX_BY.WINE_PRODUCER_NAME.name, ['producer', 'name'])
		.index(INDEX_BY.WINE_FLAG.name, ['isNewArrival', 'isClearance', 'isPriorityStock'])
		.searchIndex('search_name', { searchField: 'name' })
		.searchIndex('search_producer', { searchField: 'producer' })
		.vectorIndex('vector_description', {
			vectorField: 'descriptionEmbedding',
			dimensions: 768,
			filterFields: ['color', 'isPublished'],
		}),

	[TABLES.SCORING_RULES]: defineTable(SCORING_RULES_VALIDATOR)
		.index(INDEX_BY.SCORING_RULES_PRIORITY.name, [INDEX_BY.SCORING_RULES_PRIORITY.field])
		.index(INDEX_BY.SCORING_RULES_ACTIVE.name, [INDEX_BY.SCORING_RULES_ACTIVE.field]),

	[TABLES.INTERACTIONS]: defineTable(INTERACTIONS_VALIDATOR)
		.index(INDEX_BY.INTERACTIONS_SESSION.name, [INDEX_BY.INTERACTIONS_SESSION.field])
		.index(INDEX_BY.INTERACTIONS_DATE.name, [INDEX_BY.INTERACTIONS_DATE.field])
		.index(INDEX_BY.INTERACTIONS_OUTCOME.name, ['outcome']),

	[TABLES.WINE_FEEDBACK]: defineTable(WINE_FEEDBACK_VALIDATOR)
		.index(INDEX_BY.WINE_FEEDBACK_WINE.name, [INDEX_BY.WINE_FEEDBACK_WINE.field])
		.index(INDEX_BY.WINE_FEEDBACK_DATE.name, [INDEX_BY.WINE_FEEDBACK_DATE.field]),

	[TABLES.AUTH_STATE]: defineTable(AUTH_STATE_VALIDATOR).index(INDEX_BY.AUTH_SINGLETON.name, [
		INDEX_BY.AUTH_SINGLETON.field,
	]),

	[TABLES.IMPORT_LOGS]: defineTable(IMPORT_LOGS_VALIDATOR).index(INDEX_BY.IMPORT_LOGS_DATE.name, [
		INDEX_BY.IMPORT_LOGS_DATE.field,
	]),
});
