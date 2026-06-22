import { ConvexClient } from 'convex/browser';
import type { FunctionReference } from 'convex/server';
import { getContext, setContext } from 'svelte';
import { type Readable, readable } from 'svelte/store';
import type { api } from '../../../convex/_generated/api';

const CONVEX_CONTEXT_KEY = 'convex-client';

let client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
	if (!client) {
		const url = import.meta.env.VITE_CONVEX_URL ?? 'https://keen-buzzard-659.convex.cloud';
		client = new ConvexClient(url);
	}
	return client;
}

export function setConvexContext(): ConvexClient {
	const client = getConvexClient();
	setContext(CONVEX_CONTEXT_KEY, client);
	return client;
}

export function useConvexClient(): ConvexClient {
	return getContext<ConvexClient>(CONVEX_CONTEXT_KEY);
}

export function convexQuery<T>(
	queryRef: FunctionReference<'query', 'public', Record<string, unknown>, T>,
	args: Record<string, unknown>
): Readable<T | undefined> {
	const client = getConvexClient();
	return readable<T | undefined>(undefined, (set) => {
		return client.onUpdate(queryRef, args, (data) => {
			set(data as T);
		});
	});
}

export type { api };
