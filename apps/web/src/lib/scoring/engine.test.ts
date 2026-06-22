import type { Wine } from '@winecue/shared-types';
import { describe, expect, it } from 'vitest';
import { applyScoringRules, type ScoringRule } from './engine.js';

const baseWine: Wine = {
	id: 'wine_001',
	name: 'Sancerre Les Monts Damnés',
	producer: 'Domaine Vacheron',
	price: 89,
	stock: 12,
	color: 'white',
	tastingNotes: ['citrus', 'mineral'],
	descriptionProvenance: 't1_producer',
	dimensionsProvenance: 't2_inferred',
	isNewArrival: false,
	isClearance: false,
	isPriorityStock: false,
	isPublished: true,
	importedAt: Date.now(),
	updatedAt: Date.now(),
};

describe('applyScoringRules', () => {
	it('returns scored wines with base score when no rules exist', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [];
		const result = applyScoringRules(wines, rules);

		expect(result).toHaveLength(1);
		expect(result[0].scoreBreakdown.baseScore).toBeGreaterThan(0);
		expect(result[0].scoreBreakdown.finalScore).toBeGreaterThan(0);
		expect(result[0].filtered).toBe(false);
	});

	it('applies adjust_score rule to base_score', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'High margin boost',
				condition: { field: 'wine.price', operator: 'gt', value: 80 },
				action: { type: 'adjust_score', target: 'base_score', value: 15 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].scoreBreakdown.baseScore).toBeGreaterThan(50);
	});

	it('applies filter_out rule', () => {
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'Filter out of stock',
				condition: { field: 'wine.stock', operator: 'lt', value: 5 },
				action: { type: 'filter_out', target: 'base_score', value: 0 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const lowStockWine = { ...baseWine, stock: 2 };
		const result = applyScoringRules([lowStockWine], rules);
		expect(result[0].filtered).toBe(true);
	});

	it('does not filter when condition is not met', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'Filter out of stock',
				condition: { field: 'wine.stock', operator: 'lt', value: 5 },
				action: { type: 'filter_out', target: 'base_score', value: 0 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].filtered).toBe(false);
	});

	it('skips inactive rules', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'Inactive rule',
				condition: { field: 'wine.price', operator: 'gt', value: 0 },
				action: { type: 'adjust_score', target: 'base_score', value: 100 },
				priority: 1,
				isActive: false,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].scoreBreakdown.baseScore).toBeLessThan(100);
	});

	it('evaluates rules in priority order', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_low',
				name: 'Low priority',
				condition: { field: 'wine.price', operator: 'gt', value: 0 },
				action: { type: 'adjust_score', target: 'base_score', value: 5 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
			{
				_id: 'rule_high',
				name: 'High priority',
				condition: { field: 'wine.price', operator: 'gt', value: 0 },
				action: { type: 'adjust_score', target: 'base_score', value: 10 },
				priority: 10,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].scoreBreakdown.baseScore).toBeGreaterThan(50);
	});

	it('adds new arrival boost automatically', () => {
		const newArrivalWine = { ...baseWine, isNewArrival: true };
		const result = applyScoringRules([newArrivalWine], []);
		expect(result[0].scoreBreakdown.newArrivalBoost).toBe(5);
	});

	it('adds clearance boost automatically', () => {
		const clearanceWine = { ...baseWine, isClearance: true };
		const result = applyScoringRules([clearanceWine], []);
		expect(result[0].scoreBreakdown.clearanceBoost).toBe(8);
	});

	it('clamps final score between 0 and 100', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'Huge boost',
				condition: { field: 'wine.price', operator: 'gt', value: 0 },
				action: { type: 'adjust_score', target: 'base_score', value: 200 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].scoreBreakdown.finalScore).toBeLessThanOrEqual(100);
	});

	it('handles "in" operator for array values', () => {
		const wines = [baseWine];
		const rules: ScoringRule[] = [
			{
				_id: 'rule_1',
				name: 'Color filter',
				condition: { field: 'wine.color', operator: 'in', value: ['white', 'rose'] },
				action: { type: 'adjust_score', target: 'base_score', value: 10 },
				priority: 1,
				isActive: true,
				createdAt: Date.now(),
			},
		];

		const result = applyScoringRules(wines, rules);
		expect(result[0].scoreBreakdown.baseScore).toBeGreaterThan(50);
	});
});
