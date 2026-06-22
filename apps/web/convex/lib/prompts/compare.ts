import type { Message } from '../gemini.js';

interface WineForComparison {
	id: string;
	name: string;
	producer: string;
	price: number;
	color: string;
	grapeVariety?: string;
	vintage?: number;
	region?: string;
	country?: string;
	sweetness?: string;
	body?: string;
	tastingNotes: string[];
	description?: string;
	structuredDimensions?: {
		dryness: number;
		body: number;
		acidity: number;
		tannin?: number;
	};
	provenanceTags: string[];
}

interface CompareContext {
	wineA: WineForComparison;
	wineB: WineForComparison;
	customerQuery?: string;
}

function formatWine(wine: WineForComparison): string {
	const parts: string[] = [
		`${wine.name} by ${wine.producer}`,
		`${wine.region ?? 'Unknown'}, ${wine.country ?? ''} — ${wine.vintage ?? 'NV'}`,
		`${wine.color}${wine.grapeVariety ? `, ${wine.grapeVariety}` : ''}${wine.sweetness ? `, ${wine.sweetness}` : ''}${wine.body ? `, ${wine.body}-bodied` : ''}`,
		`${wine.price} PLN`,
	];
	if (wine.tastingNotes.length > 0) {
		parts.push(`Tasting notes: ${wine.tastingNotes.join(', ')}`);
	}
	if (wine.structuredDimensions) {
		const d = wine.structuredDimensions;
		parts.push(
			`Dimensions: dryness=${d.dryness}/10, body=${d.body}/10, acidity=${d.acidity}/10${d.tannin !== undefined ? `, tannin=${d.tannin}/10` : ''}`
		);
	}
	if (wine.description) parts.push(`Description: ${wine.description}`);
	return parts.join('\n');
}

export function buildCompareMessages(ctx: CompareContext): Message[] {
	const systemPrompt = `You are a wine expert AI. Compare two wines across multiple dimensions and help a floor associate explain the differences to a customer.

You MUST respond with valid JSON matching the required schema.

For each comparison dimension:
- label: short name (e.g., "Body", "Sweetness", "Value", "Complexity")
- scale: { minLabel, maxLabel } describing the axis endpoints
- wineA: 0–10 score for wine A on this dimension
- wineB: 0–10 score for wine B on this dimension
- explanation: 1–2 sentence comparison for this dimension

Also provide:
- summary: overall narrative summary of key differences (2–3 sentences)
- recommendation: which wine suits which preference (optional)
- confidence: 0.0–1.0 how confident you are in this comparison

Compare on at least 4–6 dimensions including: body, sweetness/dryness, acidity, complexity, value for money, and food pairing versatility. Add tannin comparison if both are red wines.`;

	const queryStr = ctx.customerQuery ? `\nCustomer context: "${ctx.customerQuery}"` : '';

	const userPrompt = `Compare these two wines:

WINE A:
${formatWine(ctx.wineA)}

WINE B:
${formatWine(ctx.wineB)}${queryStr}`;

	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	];
}
