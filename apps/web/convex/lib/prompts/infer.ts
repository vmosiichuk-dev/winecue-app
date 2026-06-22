import type { Message } from '../gemini.js';

interface InferContext {
	wineName: string;
	producer: string;
	description?: string;
	grapeVariety?: string;
	region?: string;
	color: string;
}

export function buildInferMessages(ctx: InferContext): Message[] {
	const systemPrompt = `You are a wine expert AI. Given a wine's available information, infer its structured taste dimensions on a 0–10 scale.

You MUST respond with valid JSON matching the required schema.

Dimension definitions:
- dryness: 0 = very sweet, 10 = bone dry
- body: 0 = very light, 10 = very full/heavy
- acidity: 0 = flat/soft, 10 = very crisp/acidic
- tannin: 0 = smooth/silky, 10 = very tannic/astringent (only for red wines, omit for white/rosé/sparkling)

Use your knowledge of grape varieties, regions, and wine styles to make accurate inferences.`;

	const infoParts: string[] = [`Wine: ${ctx.wineName}`, `Producer: ${ctx.producer}`];
	if (ctx.grapeVariety) infoParts.push(`Grape: ${ctx.grapeVariety}`);
	if (ctx.region) infoParts.push(`Region: ${ctx.region}`);
	infoParts.push(`Color: ${ctx.color}`);
	if (ctx.description) infoParts.push(`Description: ${ctx.description}`);

	const userPrompt = `Infer the structured dimensions for this wine:

${infoParts.join('\n')}`;

	return [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt },
	];
}
