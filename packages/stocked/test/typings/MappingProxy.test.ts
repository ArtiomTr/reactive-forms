import { SetStateAction } from 'react';
import isFunction from 'lodash/isFunction.js';
import { createPxth, deepGet, deepSet, getPxthSegments, Pxth, samePxth } from 'pxth';
import { describe, expect, it, Mock, vi } from 'vitest';

import { MappingProxy, Observer, ProxyMapSource } from '../../src/typings';

type RegisteredUser = {
	registrationDate: Date;
	personalData: {
		name: {
			firstName: string;
			lastName: string;
		};
		birthday: Date;
	};
};

const getUserMapSource = (): ProxyMapSource<RegisteredUser> => {
	return {
		registrationDate: createPxth<Date>(['registeredUser', 'dates', 'registration']),
		personalData: {
			name: {
				firstName: createPxth(['registeredUser', 'name']),
				lastName: createPxth(['registeredUser', 'surname']),
			},
			birthday: createPxth<Date>(['dateOfBirth']),
		},
	};
};

describe('Mapping proxy', () => {
	it('should instantiate', () => {
		expect(() => new MappingProxy({}, createPxth(['']))).not.toThrowError();
	});

	it('observe/stopObserving value', () => {
		const proxy = new MappingProxy(
			{ hello: createPxth(['a', 'b', 'c']), bye: createPxth(['a', 'b', 'd']) },
			createPxth(['asdf']),
		);

		const defaultObserve = vi.fn();
		const observer = vi.fn();

		defaultObserve.mockReturnValue(0);

		proxy.watch(createPxth(['asdf', 'hello']), observer, defaultObserve);

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'b', 'c']);

		defaultObserve.mockClear();

		proxy.watch(createPxth(['asdf', 'bye']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'b', 'd']);
	});

	it('observe/stopObserving value - with "watchEffect"', () => {
		const proxy = new MappingProxy(
			{ hello: createPxth(['a', 'b', 'c']), bye: createPxth(['a', 'b', 'd']) },
			createPxth(['asdf']),
		);

		const defaultObserve = vi.fn();
		const observer = vi.fn();

		defaultObserve.mockReturnValue(0);

		proxy.watchEffect(createPxth(['asdf', 'hello']), observer, defaultObserve);

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'b', 'c']);

		defaultObserve.mockClear();

		proxy.watchEffect(createPxth(['asdf', 'bye']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'b', 'd']);
	});

	it('observe/stopObserving (empty mapping path)', () => {
		const proxy = new MappingProxy(createPxth(['a', 'd', 'c']), createPxth(['asdf']));

		const defaultObserve = vi.fn();
		const observer = vi.fn();

		defaultObserve.mockReturnValue(0);

		proxy.watch(createPxth(['asdf']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'd', 'c']);

		defaultObserve.mockClear();
	});

	it('observe/stopObserving value (empty parent path)', () => {
		const proxy = new MappingProxy(
			{ hello: createPxth(['a', 'd', 'c']), bye: createPxth(['b', 'b', 'd']) },
			createPxth([]),
		);

		const defaultObserve = vi.fn();
		const observer = vi.fn();

		defaultObserve.mockReturnValue(0);

		proxy.watch(createPxth(['hello']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['a', 'd', 'c']);

		defaultObserve.mockClear();

		proxy.watch(createPxth(['bye']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['b', 'b', 'd']);
	});

	it('calling observer fns', () => {
		const fullUser = {
			personalData: {
				name: {
					firstName: 'Hello',
					lastName: 'World',
				},
				birthday: new Date('2020.12.26'),
			},
			registrationDate: new Date('2020.12.31'),
			notify: true,
		};
		const rawData = {
			registeredUser: {
				name: fullUser.personalData.name.firstName,
				surname: fullUser.personalData.name.lastName,
				dates: {
					registration: fullUser.registrationDate,
				},
			},
			dateOfBirth: fullUser.personalData.birthday,
		};

		const proxy = new MappingProxy<RegisteredUser>(getUserMapSource(), createPxth(['registeredUser']));

		const observers: Observer<unknown>[] = [];

		const defaultObserve = vi.fn((_, observer) => {
			observers.push(observer);
			return () => observers.splice(observers.indexOf(observer), 1);
		});
		const observer = vi.fn();

		proxy.watch(createPxth(['registeredUser', 'personalData', 'name', 'firstName']), observer, defaultObserve);

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['registeredUser', 'name']);

		defaultObserve.mockClear();

		proxy.watch(createPxth(['registeredUser', 'personalData', 'name']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['registeredUser']);

		defaultObserve.mockClear();

		proxy.watch(createPxth(['registeredUser', 'personalData']), observer, defaultObserve);
		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual([]);

		observers[0](rawData.registeredUser.name);

		expect(observer).toBeCalledWith(fullUser.personalData.name.firstName);

		observer.mockClear();

		observers[1](rawData.registeredUser);
		expect(observer).toBeCalledWith(fullUser.personalData.name);

		observer.mockClear();

		observers[2](rawData);
		expect(observer).toBeCalledWith(fullUser.personalData);
	});

	it('calling observer fns - with watchEffect', () => {
		const fullUser = {
			personalData: {
				name: {
					firstName: 'Hello',
					lastName: 'World',
				},
				birthday: new Date('2020.12.26'),
			},
			registrationDate: new Date('2020.12.31'),
			notify: true,
		};
		const rawData = {
			registeredUser: {
				name: fullUser.personalData.name.firstName,
				surname: fullUser.personalData.name.lastName,
				dates: {
					registration: fullUser.registrationDate,
				},
			},
			dateOfBirth: fullUser.personalData.birthday,
		};

		const proxy = new MappingProxy<RegisteredUser>(getUserMapSource(), createPxth(['registeredUser']));

		const observers: Observer<unknown>[] = [];

		const defaultObserve = vi.fn((path, observer) => {
			observer(deepGet(rawData, path));
			observers.push(observer);
			return () => observers.splice(observers.indexOf(observer), 1);
		});
		const observer = vi.fn();

		proxy.watchEffect(
			createPxth(['registeredUser', 'personalData', 'name', 'firstName']),
			observer,
			defaultObserve,
		);

		expect(observer).toBeCalledWith(fullUser.personalData.name.firstName);
		observer.mockClear();

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['registeredUser', 'name']);

		defaultObserve.mockClear();

		proxy.watchEffect(createPxth(['registeredUser', 'personalData', 'name']), observer, defaultObserve);

		expect(observer).toBeCalledWith(fullUser.personalData.name);
		observer.mockClear();

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual(['registeredUser']);

		defaultObserve.mockClear();

		proxy.watchEffect(createPxth(['registeredUser', 'personalData']), observer, defaultObserve);

		expect(observer).toBeCalledWith(fullUser.personalData);
		observer.mockClear();

		expect(getPxthSegments(defaultObserve.mock.calls[0][0])).toStrictEqual([]);
	});

	it('calling observer fns (complex cases)', () => {
		const fullData = {
			truck: {
				driver: {
					name: 'Hello',
					surname: 'Bye',
					phone: '+333533333',
				},
				info: {
					trailerNo: 'AAA111',
					truckNo: 'AAA222',
				},
				owner: {
					companyId: 0,
					companyName: 'Hello World',
					contacts: [
						{
							contactId: 0,
							name: 'Bill Bill',
							contactInfo: {
								email: 'bill.bill@mail.loc',
								phone: '+333 333 333',
							},
						},
					],
				},
			},
		};
		const rawData = {
			truck: {
				plate_no: fullData.truck.info.truckNo,
			},
			trailer: {
				plate_no: fullData.truck.info.trailerNo,
			},
			company: fullData.truck.owner.companyName,
			contact_name: fullData.truck.owner.contacts[0].name,
			contact_id: fullData.truck.owner.contacts[0].contactId,
			contact_email: fullData.truck.owner.contacts[0].contactInfo.email,
			contact_phone: fullData.truck.owner.contacts[0].contactInfo.phone,
		};

		const proxy = new MappingProxy<{
			info: {
				truckNo: string;
				trailerNo: string;
			};
			owner: {
				name: string;
				contactId: number;
				contactInfo: {
					email: string;
					phone: string;
				};
			};
		}>(
			{
				info: {
					truckNo: createPxth(['truck', 'plate_no']),
					trailerNo: createPxth(['trailer', 'plate_no']),
				},
				owner: {
					name: createPxth(['contact_name']),
					contactId: createPxth(['contact_id']),
					contactInfo: {
						email: createPxth(['contact_email']),
						phone: createPxth(['contact_phone']),
					},
				},
			},
			createPxth(['truck']),
		);

		const observers: Observer<unknown>[] = [];

		const defaultWatch = vi.fn((_, observer) => {
			observers.push(observer);
			return () => observers.splice(observers.indexOf(observer), 1);
		});
		const observer = vi.fn();

		proxy.watch(createPxth(['truck', 'owner']), observer, defaultWatch);
		expect(getPxthSegments(defaultWatch.mock.calls[0][0])).toStrictEqual([]);

		defaultWatch.mockClear();

		proxy.watch(createPxth(['truck', 'info']), observer, defaultWatch);
		expect(getPxthSegments(defaultWatch.mock.calls[0][0])).toStrictEqual([]);

		observers[0](rawData);
		expect(observer).toBeCalledWith(fullData.truck.owner.contacts[0]);

		observer.mockClear();

		observers[1](rawData);
		expect(observer).toBeCalledWith(fullData.truck.info);
	});

	it('should set proxied value', () => {
		const proxy = new MappingProxy<RegisteredUser>(getUserMapSource(), createPxth(['registeredUser']));

		const defaultSetValue = vi.fn();
		const defaultGetValue = vi.fn();

		proxy.setValue(
			createPxth(['registeredUser', 'personalData', 'name', 'firstName']),
			'Hello',
			defaultSetValue,
			defaultGetValue,
		);

		expect(getPxthSegments(defaultSetValue.mock.calls[0][0])).toStrictEqual(['registeredUser', 'name']);
		expect(defaultSetValue).toBeCalledWith(expect.anything(), 'Hello');

		defaultSetValue.mockClear();

		proxy.setValue(
			createPxth(['registeredUser', 'personalData', 'name']),
			{ firstName: 'As', lastName: 'Df' },
			defaultSetValue,
			defaultGetValue,
		);

		expect(
			defaultSetValue.mock.calls.findIndex(
				([path, value]) => samePxth(path, createPxth(['registeredUser', 'name'])) && value === 'As',
			) !== -1,
		).toBeTruthy();

		expect(
			defaultSetValue.mock.calls.findIndex(
				([path, value]) => samePxth(path, createPxth(['registeredUser', 'surname'])) && value === 'Df',
			) !== -1,
		).toBeTruthy();
	});

	it('should set proxied value based on the old value', () => {
		const proxy = new MappingProxy<RegisteredUser>(getUserMapSource(), createPxth(['registeredUser']));

		const defaultSetValue = vi.fn();
		const getStringValue = vi.fn(() => 'old value');

		proxy.setValue(
			createPxth(['registeredUser', 'personalData', 'name', 'firstName']),
			(old) => old + ' updated',
			defaultSetValue,
			getStringValue as <U>(path: Pxth<U>) => U,
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(getPxthSegments((getStringValue as Mock<(...args: any[]) => any>).mock.calls[0][0])).toStrictEqual([
			'registeredUser',
			'name',
		]);
		expect(getPxthSegments(defaultSetValue.mock.calls[0][0])).toStrictEqual(['registeredUser', 'name']);
		expect(defaultSetValue).toBeCalledWith(expect.anything(), 'old value updated');

		defaultSetValue.mockClear();
		const getObjectValue = vi.fn(() => ({ firstName: 'As', lastName: 'Df' })) as <U>(path: Pxth<U>) => U;

		proxy.setValue(
			createPxth<object>(['registeredUser', 'personalData', 'name']),
			(old: object) => ({ ...old, lastName: 'updated' }),
			defaultSetValue,
			getObjectValue,
		);

		expect(
			defaultSetValue.mock.calls.findIndex(
				([path, value]) => samePxth(path, createPxth(['registeredUser', 'name'])) && value === 'As',
			) !== -1,
		).toBeTruthy();

		expect(
			defaultSetValue.mock.calls.findIndex(
				([path, value]) => samePxth(path, createPxth(['registeredUser', 'surname'])) && value === 'updated',
			) !== -1,
		).toBeTruthy();
	});

	it('should get proxied value', () => {
		const fullUser = {
			personalData: {
				name: {
					firstName: 'Hello',
					lastName: 'World',
				},
				birthday: new Date('2020.12.26'),
			},
			registrationDate: new Date('2020.12.31'),
			notify: true,
		};
		const rawData = {
			registeredUser: {
				name: fullUser.personalData.name.firstName,
				surname: fullUser.personalData.name.lastName,
				dates: {
					registration: fullUser.registrationDate,
				},
			},
			dateOfBirth: fullUser.personalData.birthday,
		};

		const proxy = new MappingProxy<RegisteredUser>(getUserMapSource(), createPxth(['registeredUser']));

		const defaultGet = <V>(path: Pxth<V>) => deepGet(rawData, path);

		expect(proxy.getValue(createPxth(['registeredUser', 'personalData', 'name', 'firstName']), defaultGet)).toBe(
			fullUser.personalData.name.firstName,
		);
		expect(proxy.getValue(createPxth(['registeredUser', 'personalData', 'name']), defaultGet)).toStrictEqual(
			fullUser.personalData.name,
		);
		expect(proxy.getValue(createPxth(['registeredUser', 'personalData', 'birthday']), defaultGet)).toStrictEqual(
			fullUser.personalData.birthday,
		);
	});

	it('should return normal path from proxied path', () => {
		const proxy = new MappingProxy<RegisteredUser & { location: { city: string } }>(
			{
				...getUserMapSource(),
				location: createPxth<{ city: string }>(['registeredUser', 'personalData', 'home_location']),
			},
			createPxth(['registeredUser']),
		);

		expect(getPxthSegments(proxy.getNormalPath(createPxth(['registeredUser', 'personalData'])))).toStrictEqual([]);
		expect(getPxthSegments(proxy.getNormalPath(createPxth(['registeredUser', 'registrationDate'])))).toStrictEqual([
			'registeredUser',
			'dates',
			'registration',
		]);
		expect(
			getPxthSegments(proxy.getNormalPath(createPxth(['registeredUser', 'personalData', 'name']))),
		).toStrictEqual(['registeredUser']);
		expect(getPxthSegments(proxy.getNormalPath(createPxth(['registeredUser', 'location', 'city'])))).toStrictEqual([
			'registeredUser',
			'personalData',
			'home_location',
			'city',
		]);
	});

	it('should return proxied path from normal path', () => {
		const proxy = new MappingProxy<RegisteredUser>(
			{
				registrationDate: createPxth<Date>(['registeredUser', 'dates', 'registration']),
				personalData: {
					name: {
						firstName: createPxth(['registeredUser', 'name']),
						lastName: createPxth(['registeredUser', 'surname']),
					},
					birthday: createPxth<Date>(['dateOfBirth']),
				},
			},
			createPxth(['registeredUser']),
		);

		expect(
			getPxthSegments(proxy.getProxiedPath(createPxth(['registeredUser', 'dates', 'registration']))),
		).toStrictEqual(['registeredUser', 'registrationDate']);
		expect(getPxthSegments(proxy.getProxiedPath(createPxth(['registeredUser', 'name'])))).toStrictEqual([
			'registeredUser',
			'personalData',
			'name',
			'firstName',
		]);
		expect(() => proxy.getProxiedPath(createPxth(['registeredUser', 'personalData']))).toThrow();
	});

	it('should getValue from nested path', () => {
		const proxy = new MappingProxy(
			{
				location: createPxth(['core', 'values', 'location_from']),
				cmpId: createPxth(['core', 'cmp_id_from']),
			},
			createPxth(['compound']),
		);

		const values = {
			core: {
				cmp_id_from: 5,
				values: {
					location_from: {
						id: 24,
					},
				},
			},
		};

		const fn = vi.fn((path) => {
			return deepGet(values, path);
		});
		const value = proxy.getValue(createPxth(['compound', 'location', 'id']), fn as <U>(path: Pxth<U>) => U);
		expect(value).toBe(24);
	});

	it('should setValue to nested path', () => {
		const proxy = new MappingProxy(
			{
				location: createPxth(['core', 'values', 'location_from']),
				cmpId: createPxth(['core', 'cmp_id_from']),
			},
			createPxth(['compound']),
		);

		const values = {
			core: {
				cmp_id_from: 5,
				values: {
					location_from: {
						id: 24,
						info: {
							street: 'Gedimino g.',
							city: 'Vilnius',
						},
					},
				},
			},
		};

		const defaultSetValue: <U>(path: Pxth<U>, value: SetStateAction<U>) => void = vi.fn(
			<U>(path: Pxth<U>, value: SetStateAction<U>) => {
				deepSet(values, path, isFunction(value) ? deepGet(values, path) : value);
			},
		);
		const defaultGetValue = vi.fn();

		proxy.setValue(createPxth(['compound', 'location', 'id']), 42, defaultSetValue, defaultGetValue);
		expect(values).toStrictEqual({
			core: {
				cmp_id_from: 5,
				values: {
					location_from: {
						id: 42,
						info: {
							street: 'Gedimino g.',
							city: 'Vilnius',
						},
					},
				},
			},
		});

		proxy.setValue(
			createPxth(['compound', 'location', 'info']),
			{
				city: 'Kaunas',
				street: 'Teodoro',
			},
			defaultSetValue,
			defaultGetValue,
		);
		expect(values).toStrictEqual({
			core: {
				cmp_id_from: 5,
				values: {
					location_from: {
						id: 42,
						info: {
							city: 'Kaunas',
							street: 'Teodoro',
						},
					},
				},
			},
		});
	});

	it('should watch value from nested path', () => {
		const proxy = new MappingProxy(
			{
				location: createPxth(['core', 'values', 'location_from']),
				cmpId: createPxth(['core', 'cmp_id_from']),
			},
			createPxth(['compound']),
		);

		const observer = vi.fn();
		const defaultWatch = vi.fn((_path, proxiedObserver: (value: unknown) => void) => {
			proxiedObserver(42);
			return vi.fn();
		});

		proxy.watch(
			createPxth(['compound', 'location', 'id']),
			observer,
			defaultWatch as <U>(path: Pxth<U>, observer: Observer<U>) => () => void,
		);

		expect(getPxthSegments(defaultWatch.mock.calls[0][0])).toStrictEqual(['core', 'values', 'location_from', 'id']);
		expect(defaultWatch.mock.calls[0][1]).toBeDefined();
		expect(observer).toBeCalledWith(42);
	});

	it('should handle arrays', () => {
		const proxy = new MappingProxy(
			{
				values: [
					{
						hello: createPxth(['real', 'path']),
					},
				],
			},
			createPxth(['proxied_path']),
		);

		expect(
			getPxthSegments(proxy.getNormalPath(createPxth(['proxied_path', 'values', '0', 'hello']))),
		).toStrictEqual(['real', 'path']);
	});
});
