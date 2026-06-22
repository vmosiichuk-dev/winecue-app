import type { Message } from '../gemini.js';

interface WineCandidate {
	id: string;
	name: string;
	producer: string;
	price: number;
	color: string;
	sweetness?: string;
	body?: string;
	grapeVariety?: string;
	vintage?: number;
	region?: string;
	tastingNotes: string[];
	description?: string;
	structuredDimensions?: {
		dryness: number;
		body: number;
		acidity: number;
		tannin?: number;
	};
}

interface RecommendContext {
	query: string;
	filters?: {
		color?: string;
		sweetness?: string;
		body?: string;
		priceMin?: number;
		priceMax?: number;
		tastingNotes?: string[];
		excludeWineIds?: string[];
	};
	candidates: WineCandidate[];
}

export function buildRecommendMessages(ctx: RecommendContext): Message[] {
	const candidateList = ctx.candidates
		.map((w) => {
			const dims = w.structuredDimensions
				? ` [dryness:${w.structuredDimensions.dryness}/10, body:${w.structuredDimensions.body}/10, acidity:${w.structuredDimensions.acidity}/10${w.structuredDimensions.tannin !== undefined ? `, tannin:${w.structuredDimensions.tannin}/10` : ''}]`
				: '';
			const notes = w.tastingNotes.length > 0 ? ` Notes: ${w.tastingNotes.join(', ')}.` : '';
			const desc = w.description ? ` ${w.description}` : '';
			return `- [${w.id}] ${w.name} by ${w.producer} (${w.region ?? 'Unknown region'}, ${w.vintage ?? 'NV'}) — ${w.color}, ${w.grapeVariety ?? 'blend'}${w.sweetness ? `, ${w.sweetness}` : ''}${w.body ? `, ${w.body}-bodied` : ''} — ${w.price} PLN${dims}.${notes}${desc}`;
		})
		.join('\n');

	const filterParts: string[] = [];
	if (ctx.filters?.color) filterParts.push(`color: ${ctx.filters.color}`);
	if (ctx.filters?.sweetness) filterParts.push(`sweetness: ${ctx.filters.sweetness}`);
	if (ctx.filters?.body) filterParts.push(`body: ${ctx.filters.body}`);
	if (ctx.filters?.priceMin) filterParts.push(`min price: ${ctx.filters.priceMin} PLN`);
	if (ctx.filters?.priceMax) filterParts.push(`max price: ${ctx.filters.priceMax} PLN`);
	if (ctx.filters?.tastingNotes?.length)
		filterParts.push(`tasting notes: ${ctx.filters.tastingNotes.join(', ')}`);
	const filterStr = filterParts.length > 0 ? `\nHard filters: ${filterParts.join('; ')}.` : '';

	const systemPrompt = `You are WineCue, an AI sommelier assistant for a Polish wine shop. A floor associate has relayed a customer's request. Your job is to select the best matching wines from the available catalogue.

You MUST respond with valid JSON matching the required schema. For each recommended wine:
- confidence: 0.0–1.0 score indicating how well it matches the request
- reasoning: a brief, natural-language explanation the associate can relay to the customer (1–2 sentences)
- wineId: must be one of the candidate IDs provided

Also provide queryInterpretation showing what you understood from the customer's request.

Rules:
1. Only recommend wines from the candidate list provided
2. Respect all hard filters exactly — never suggest a wine that violates them
3. Consider structured dimensions when the customer mentions taste preferences
4. Factor in vintage, region, and grape variety when relevant
5. Prefer higher-margin and priority stock when quality is similar${filterStr}`;

	const userPrompt = `Customer request: "${ctx.query}"

Available wines (${ctx.candidates.length} candidates):
${candidateList}

Select the top matches and explain your reasoning.`;

	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	];
}
