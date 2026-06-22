class SessionStore {
	isAuthenticated = $state(false);
	sessionId = $state(crypto.randomUUID());

	authenticate() {
		this.isAuthenticated = true;
	}

	logout() {
		this.isAuthenticated = false;
	}

	reset() {
		this.isAuthenticated = false;
		this.sessionId = crypto.randomUUID();
	}
}

export const session = new SessionStore();
