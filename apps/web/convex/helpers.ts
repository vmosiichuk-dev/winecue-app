import { v } from 'convex/values';

export function convexUnionFromConst<T extends Record<string, string>>(constant: T) {
	const values = Object.values(constant);
	return v.union(...values.map((value) => v.literal(value)));
}
