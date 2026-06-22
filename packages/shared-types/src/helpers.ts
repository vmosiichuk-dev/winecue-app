import { z } from 'zod';

export function zodEnumFromConst<T extends Record<string, string>>(constant: T) {
	const values = Object.values(constant);
	return z.enum(values as [T[keyof T], ...T[keyof T][]]);
}
