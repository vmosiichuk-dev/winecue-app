import { describe, expect, it } from 'vitest';
import { buildRecommendMessages } from './recommend.js';

const mockCandidate = {
	id: 'wine_001',
	name: 'Sancerre Les Monts Damnés',
	producer: 'Domaine Vacheron',
	price: 89,
	color: 'white',
	sweetness: 'dry',
	body: 'light',
	grapeVariety: 'Sauvignon Blanc',
	vintage: 2022,
	region: 'Loire Valley',
	tastingNotes: ['citrus', 'mineral', 'flint'],
	description: 'A crisp, mineral-driven Sancerre with vibrant acidity.',
	structuredDimensions: {
		dryness: 9,
		body: 3,
		acidity: 8,
	},
};

describe('buildRecommendMessages', () => {
	it('returns system and user messages', () => {
		const messages = buildRecommendMessages({
			query: 'I want a crisp white wine under 100 PLN',
			candidates: [mockCandidate],
		});

		expect(messages).toHaveLength(2);
		expect(messages[0].role).toBe('system');
		expect(messages[1].role).toBe('user');
	});

	it('includes the customer query in the user message', () => {
		const messages = buildRecommendMessages({
			query: 'Something light and fruity',
			candidates: [mockCandidate],
		});

		expect(messages[1].content).toContain('Something light and fruity');
	});

	it('includes wine candidate details', () => {
		const messages = buildRecommendMessages({
			query: 'A white wine',
			candidates: [mockCandidate],
		});

		expect(messages[1].content).toContain('Sancerre Les Monts Damnés');
		expect(messages[1].content).toContain('Domaine Vacheron');
		expect(messages[1].content).toContain('89 PLN');
	});

	it('includes structured dimensions when available', () => {
		const messages = buildRecommendMessages({
			query: 'A dry white',
			candidates: [mockCandidate],
		});

		expect(messages[1].content).toContain('dryness:9/10');
		expect(messages[1].content).toContain('body:3/10');
	});

	it('includes hard filters in system prompt', () => {
		const messages = buildRecommendMessages({
			query: 'A white wine',
			filters: {
				color: 'white',
				priceMax: 100,
			},
			candidates: [mockCandidate],
		});

		expect(messages[0].content).toContain('color: white');
		expect(messages[0].content).toContain('max price: 100 PLN');
	});

	it('includes tasting notes', () => {
		const messages = buildRecommendMessages({
			query: 'A mineral wine',
			candidates: [mockCandidate],
		});

		expect(messages[1].content).toContain('citrus, mineral, flint');
	});

	it('handles empty candidates list', () => {
		const messages = buildRecommendMessages({
			query: 'Any wine',
			candidates: [],
		});

		expect(messages).toHaveLength(2);
		expect(messages[1].content).toContain('0 candidates');
	});
});
