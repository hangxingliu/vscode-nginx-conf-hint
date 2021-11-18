export class MapList<T = unknown> extends Map<string, T[]> {
	push(key: string, ...items: T[]) {
		const value = this.get(key);
		if (!value) this.set(key, items);
		else value.push(...items);
	}
	getList(key: string): T[] {
		return this.get(key) || [];
	}
	getKeys() {
		return Array.from(this.keys());
	}
}
