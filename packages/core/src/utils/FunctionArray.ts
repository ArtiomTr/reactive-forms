import invariant from 'tiny-invariant';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FunctionArray<T extends (...args: any[]) => any> {
	private items: Array<T> = [];

	public call = (...args: Parameters<T>): ReturnType<T>[] => {
		return this.items.map((func) => func(...args));
	};

	public lazyCall = (...args: Parameters<T>): ReturnType<T> | undefined => {
		for (const item of this.items) {
			const output = item(...args);
			if (output !== null && output !== undefined && output !== void 0) {
				return output;
			}
		}
		return undefined;
	};

	public asyncCall = async (...args: Parameters<T>): Promise<ReturnType<T>[]> => {
		return Promise.all(this.items.map(async (func) => await func(...args)));
	};

	public lazyAsyncCall = async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
		for (const item of this.items) {
			const output = await item(...args);
			if (output !== null && output !== undefined && output !== void 0) {
				return output;
			}
		}
		return undefined;
	};

	public push = (func: T) => {
		this.items.push(func);
	};

	public remove = (func: T) => {
		const index = this.items.indexOf(func);

		invariant(index !== -1, 'Could not remove, because function does not exist in array.');

		this.items.splice(index, 1);
	};

	public isEmpty = () => this.items.length === 0;
}

export type Observer<T> = (message: T) => void;

export type ObserversArray<T> = FunctionArray<Observer<T>>;
