function mockData() {
	return {
		id: 1,
		name: 'Test Category'
	};
}

function expectToEqual(actual, expected) {
	if (actual !== expected) {
		throw new Error(`Expected ${expected}, but got ${actual}`);
	}
}

export { mockData, expectToEqual };