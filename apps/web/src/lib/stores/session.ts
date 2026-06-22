import { writable } from 'svelte/store';

export interface SessionState {
	isAuthenticated: boolean;
	sessionId: string;
}

function createSessionStore() {
	const { subscribe, set, update } = writable<SessionState>({
		isAuthenticated: false,
		sessionId: crypto.randomUUID(),
	});

	return {
		subscribe,
		authenticate: () => update((s) => ({ ...s, isAuthenticated: true })),
		logout: () => update((s) => ({ ...s, isAuthenticated: false })),
		reset: () =>
			set({
				isAuthenticated: false,
				sessionId: crypto.randomUUID(),
			}),
	};
}

export const session = createSessionStore();
