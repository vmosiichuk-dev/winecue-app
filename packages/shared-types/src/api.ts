import { z } from 'zod';
import { InteractionOutcome, RecommendedWineSchema } from './interaction.js';
import { WineBody, WineColor, WineSchema, WineSweetness } from './wine.js';

export const RecommendRequestSchema = z.object({
	query: z.string().min(1).max(500).describe('Customer request in natural language'),
	filters: z
		.object({
			color: WineColor.optional(),
			sweetness: WineSweetness.optional(),
			body: WineBody.optional(),
			priceMin: z.number().min(44).optional(),
			priceMax: z.number().max(400).optional(),
			tastingNotes: z.array(z.string()).optional(),
			excludeWineIds: z.array(z.string()).optional().describe('Wines already rejected'),
		})
		.optional(),
	sessionContext: z
		.object({
			sessionId: z.string().max(500),
			previousQueries: z.array(z.string().max(500)).optional(),
			accumulatedPreferences: z.array(z.string().max(500)).optional(),
			rejectedWineIds: z.array(z.string()).optional(),
		})
		.optional(),
});

export const RecommendResponseSchema = z.object({
	success: z.literal(true),
	mainContenders: z.array(RecommendedWineSchema).length(2).describe('Top 2 wines'),
	alternatives: z.array(RecommendedWineSchema).max(2).describe('1–2 follow-ups'),
	queryInterpretation: z
		.object({
			detectedColor: WineColor.optional(),
			detectedSweetness: WineSweetness.optional(),
			detectedBody: WineBody.optional(),
			detectedPriceRange: z.object({ min: z.number(), max: z.number() }).optional(),
			detectedTastingNotes: z.array(z.string()).optional(),
		})
		.describe('What the AI understood from the query'),
	usedFallback: z.boolean().describe('Whether a fallback AI model was used'),
	responseTimeMs: z.number(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;
export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

export const CompareRequestSchema = z.object({
	wineAId: z.string().max(64),
	wineBId: z.string().max(64),
	sessionContext: z
		.object({
			sessionId: z.string().max(64),
			customerQuery: z.string().max(500).optional(),
		})
		.optional(),
});

export const WineComparisonDimensionSchema = z.object({
	label: z.string(),
	scale: z.object({
		minLabel: z.string(),
		maxLabel: z.string(),
	}),
	wineA: z.number().min(0).max(10),
	wineB: z.number().min(0).max(10),
	explanation: z.string().describe('AI-generated comparison for this dimension'),
});

export const CompareResponseSchema = z.object({
	success: z.literal(true),
	wineA: z.object({
		id: z.string(),
		name: z.string(),
		producer: z.string(),
		price: z.number(),
		color: WineColor,
		provenanceTags: z.array(z.string()),
	}),
	wineB: z.object({
		id: z.string(),
		name: z.string(),
		producer: z.string(),
		price: z.number(),
		color: WineColor,
		provenanceTags: z.array(z.string()),
	}),
	dimensions: z.array(WineComparisonDimensionSchema).describe('Visual comparison axes'),
	summary: z.string().describe('Narrative summary of key differences'),
	recommendation: z.string().optional().describe('Which wine suits which preference'),
	confidence: z.number().min(0).max(1),
	usedFallback: z.boolean(),
	responseTimeMs: z.number(),
});

export type CompareRequest = z.infer<typeof CompareRequestSchema>;
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

export const ImportResponseSchema = z.object({
	success: z.literal(true),
	dryRun: z.boolean(),
	summary: z.object({
		rowsProcessed: z.number(),
		rowsImported: z.number(),
		rowsUpdated: z.number(),
		rowsFailed: z.number(),
		winesInStock: z.number(),
	}),
	errors: z.array(
		z.object({
			row: z.number(),
			rawData: z.record(z.string(), z.string()),
			message: z.string(),
		})
	),
	warnings: z
		.array(
			z.object({
				row: z.number(),
				message: z.string(),
			})
		)
		.optional(),
});

export type ImportResponse = z.infer<typeof ImportResponseSchema>;

export const ListWinesQuerySchema = z.object({
	color: WineColor.optional(),
	inStock: z.boolean().optional().default(true),
	minPrice: z.number().optional(),
	maxPrice: z.number().optional(),
	search: z.string().max(500).optional(),
	sortBy: z.enum(['price', 'name', 'stock', 'margin']).optional().default('name'),
	sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
	limit: z.number().max(100).optional().default(50),
	cursor: z.string().max(64).optional(),
});

export const ListWinesResponseSchema = z.object({
	success: z.literal(true),
	wines: z.array(WineSchema),
	nextCursor: z.string().optional(),
	totalCount: z.number(),
});

export type ListWinesQuery = z.infer<typeof ListWinesQuerySchema>;
export type ListWinesResponse = z.infer<typeof ListWinesResponseSchema>;

export const LogInteractionRequestSchema = z.object({
	interactionId: z.string().max(64),
	outcome: InteractionOutcome,
	selectedWineId: z.string().optional(),
	feedback: z.string().optional(),
});

export const LogInteractionResponseSchema = z.object({
	success: z.literal(true),
	loggedAt: z.number(),
});

export type LogInteractionRequest = z.infer<typeof LogInteractionRequestSchema>;
export type LogInteractionResponse = z.infer<typeof LogInteractionResponseSchema>;

export const AddFeedbackRequestSchema = z.object({
	wineId: z.string().max(64),
	feedback: z.string().min(1).max(1000),
	interactionId: z.string().max(64).optional(),
});

export const AddFeedbackResponseSchema = z.object({
	success: z.literal(true),
	feedbackId: z.string(),
});

export type AddFeedbackRequest = z.infer<typeof AddFeedbackRequestSchema>;
export type AddFeedbackResponse = z.infer<typeof AddFeedbackResponseSchema>;

export const AuthVerifyRequestSchema = z.object({
	pin: z
		.string()
		.length(4)
		.regex(/^\d{4}$/),
});

export const AuthVerifyResponseSchema = z.object({
	success: z.literal(true),
	token: z.string().describe('Session token (stored in httpOnly cookie)'),
});

export const AuthErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.enum(['INVALID_PIN', 'ACCOUNT_LOCKED', 'VALIDATION_ERROR']),
		message: z.string(),
		lockedUntil: z.number().optional(),
	}),
});

export type AuthVerifyRequest = z.infer<typeof AuthVerifyRequestSchema>;
export type AuthVerifyResponse = z.infer<typeof AuthVerifyResponseSchema>;

export const AuthLogoutResponseSchema = z.object({
	success: z.literal(true),
});

export type AuthLogoutResponse = z.infer<typeof AuthLogoutResponseSchema>;

export const ApiErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.enum([
			'VALIDATION_ERROR',
			'AI_TIMEOUT',
			'AI_UNAVAILABLE',
			'NO_MATCHES',
			'UNAUTHORIZED',
			'INTERNAL_ERROR',
		]),
		message: z.string(),
		details: z.record(z.string(), z.unknown()).optional(),
	}),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
