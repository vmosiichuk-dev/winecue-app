import { z } from 'zod';

export const WineColor = z.enum(['red', 'white', 'rose', 'sparkling', 'fortified', 'spirit']);
export const WineSweetness = z.enum(['dry', 'semi_dry', 'semi_sweet', 'sweet']);
export const WineBody = z.enum(['light', 'medium', 'full']);
export const DataProvenance = z.enum(['t1_producer', 't2_inferred', 't3_wordpress']);

export const StructuredDimensions = z.object({
	dryness: z.number().min(0).max(10).describe('0 = very sweet, 10 = very dry'),
	body: z.number().min(0).max(10).describe('0 = very light, 10 = very full'),
	acidity: z.number().min(0).max(10).describe('0 = flat, 10 = very acidic'),
	tannin: z.number().min(0).max(10).optional().describe('Reds only: 0 = smooth, 10 = very tannic'),
});

export const WineSchema = z.object({
	id: z.string().describe('Convex document ID'),
	name: z.string().min(1).describe('Wine name as shown on shelf'),
	producer: z.string().min(1).describe('Producer / winery name'),
	country: z.string().optional().describe('Country of origin'),
	region: z.string().optional().describe('Wine region (e.g., Tuscany, Loire)'),
	grapeVariety: z.string().optional().describe('Primary grape(s)'),
	vintage: z
		.number()
		.int()
		.min(1800)
		.max(new Date().getFullYear() + 1)
		.optional(),

	price: z.number().positive().describe('Price in PLN'),
	stock: z.number().int().min(0).describe('Current shelf quantity'),
	costPrice: z.number().positive().optional().describe('Wholesale cost for margin calc'),
	marginPercent: z.number().optional().describe('Calculated margin %'),

	color: WineColor,
	sweetness: WineSweetness.optional(),
	body: WineBody.optional(),

	tastingNotes: z.array(z.string()).default([]).describe('Structured tasting note tags'),
	description: z.string().optional().describe('Full text description'),
	structuredDimensions: StructuredDimensions.optional(),

	descriptionProvenance: DataProvenance.default('t2_inferred'),
	dimensionsProvenance: DataProvenance.default('t2_inferred'),
	producerUrl: z.string().url().optional().describe('Official producer website'),
	producerDescription: z.string().optional().describe('Cached text from producer site'),

	isNewArrival: z.boolean().default(false),
	isClearance: z.boolean().default(false),
	isPriorityStock: z.boolean().default(false).describe('Not restocking — sell fast'),
	isPublished: z.boolean().default(true).describe('Visible in recommendations'),

	importedAt: z.number().describe('Unix timestamp of import'),
	updatedAt: z.number().describe('Unix timestamp of last update'),
});

export type Wine = z.infer<typeof WineSchema>;
