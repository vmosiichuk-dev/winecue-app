import { describe, expect, it } from 'vitest';
import { WineColor, WineSchema } from './wine.js';

const validWine = {
	id: 'wine_001',
	name: 'Sancerre Les Monts Damnés',
	producer: 'Domaine Vacheron',
	price: 89,
	stock: 12,
	color: 'white',
	importedAt: Date.now(),
	updatedAt: Date.now(),
};

describe('WineSchema', () => {
	it('accepts a valid wine record', () => {
		const result = WineSchema.safeParse(validWine);
		expect(result.success).toBe(true);
	});

	it('rejects a wine with a negative price', () => {
		const result = WineSchema.safeParse({ ...validWine, price: -10 });
		expect(result.success).toBe(false);
	});

	it('rejects a wine with an invalid color', () => {
		const result = WineSchema.safeParse({ ...validWine, color: 'blue' });
		expect(result.success).toBe(false);
	});

	it('rejects a wine missing required fields', () => {
		const result = WineSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects a vintage year below 1800', () => {
		const result = WineSchema.safeParse({ ...validWine, vintage: 1700 });
		expect(result.success).toBe(false);
	});

	it('rejects a vintage year beyond next year', () => {
		const result = WineSchema.safeParse({ ...validWine, vintage: new Date().getFullYear() + 2 });
		expect(result.success).toBe(false);
	});

	it('rejects an invalid producerUrl', () => {
		const result = WineSchema.safeParse({ ...validWine, producerUrl: 'not-a-url' });
		expect(result.success).toBe(false);
	});

	it('rejects tastingNotes containing non-string values', () => {
		const result = WineSchema.safeParse({ ...validWine, tastingNotes: [123, { note: 'test' }] });
		expect(result.success).toBe(false);
	});

	it('accepts a wine with zero stock', () => {
		const result = WineSchema.safeParse({ ...validWine, stock: 0 });
		expect(result.success).toBe(true);
	});
});

describe('WineColor', () => {
	it('includes red, white, rose, sparkling, fortified, spirit', () => {
		expect(WineColor.options).toContain('red');
		expect(WineColor.options).toContain('white');
		expect(WineColor.options).toContain('sparkling');
	});
});

describe('WineSweetness', () => {
	it('defaults to dry when used in WineSchema', () => {
		const wine = { ...validWine, sweetness: 'dry' };
		const result = WineSchema.safeParse(wine);
		expect(result.success).toBe(true);
	});
});
