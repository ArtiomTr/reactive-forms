import { SetStateAction, useCallback, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep.js';
import isFunction from 'lodash/isFunction.js';
import unset from 'lodash/unset.js';
import { deepGet, deepSet, getPxthSegments, isInnerPxth, Pxth, samePxth } from 'pxth';
import invariant from 'tiny-invariant';

import { Stock } from '../hooks/useStock';
import { Observer } from '../typings';
import { StockProxy } from '../typings/StockProxy';

const shouldUseProxy = (proxy: StockProxy<unknown> | undefined, path: Pxth<unknown>) =>
	proxy && (isInnerPxth(proxy.path, path) || samePxth(proxy.path, path));

/**
 * Helper function. Calls `standardCallback` if `proxy` is undefined, or if `path` isn't inner path of `proxy.path` variable.
 * Otherwise, calls `proxiedCallback`.
 * Passes args into function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const intercept = <T extends (...args: any[]) => any>(
	proxy: StockProxy<unknown> | undefined,
	path: Pxth<unknown>,
	standardCallback: T,
	proxiedCallback: T,
	args: Parameters<T>,
): ReturnType<T> => {
	if (!shouldUseProxy(proxy, path)) {
		return standardCallback(...args);
	} else {
		return proxiedCallback(...args);
	}
};

/** Intercepts stock's `observe`, `stopObserving` and `setValue` functions, if proxy is provided. */
export const useInterceptors = <T extends object>(stock: Stock<T>, proxy?: StockProxy<unknown>): Stock<T> => {
	const { watch, watchEffect, setValue, getValue, setValues, getValues } = stock;

	useEffect(
		() =>
			invariant(
				!proxy || proxy.isActive(),
				'Cannot use not activated proxy. Maybe you forgot to call proxy.activate()?',
			),
		[proxy],
	);

	const interceptedWatch = useCallback(
		<V>(path: Pxth<V>, observer: Observer<V>) =>
			intercept(
				proxy,
				path as Pxth<unknown>,
				watch,
				(path: Pxth<V>, observer: Observer<V>) => proxy!.watch<V>(path, observer, watch),
				[path, observer],
			),
		[watch, proxy],
	);

	const interceptedWatchEffect = useCallback(
		<V>(path: Pxth<V>, observer: Observer<V>) =>
			intercept(
				proxy,
				path as Pxth<unknown>,
				watchEffect,
				(path: Pxth<V>, observer: Observer<V>) => proxy!.watchEffect<V>(path, observer, watchEffect),
				[path, observer],
			),
		[watchEffect, proxy],
	);

	const interceptedSetValue = useCallback(
		<V>(path: Pxth<V>, value: SetStateAction<V>) =>
			intercept(
				proxy,
				path as Pxth<unknown>,
				setValue,
				<V>(path: Pxth<V>, value: SetStateAction<V>) => proxy!.setValue(path, value, setValue, getValue),
				[path as Pxth<unknown>, value],
			),
		[getValue, proxy, setValue],
	);

	const interceptedGetValue = useCallback(
		<V>(path: Pxth<V>) =>
			intercept(proxy, path as Pxth<unknown>, getValue, (path: Pxth<V>) => proxy!.getValue<V>(path, getValue), [
				path,
			]),
		[proxy, getValue],
	);

	const interceptedGetValues = useCallback(() => {
		let allValues = cloneDeep(getValues());

		const proxiedValue = proxy!.getValue(proxy!.path, getValue);

		allValues = deepSet(allValues, proxy!.path, proxiedValue) as T;

		return allValues;
	}, [proxy, getValues, getValue]);

	const interceptedSetValues = useCallback(
		(values: T) => {
			const proxiedValue = deepGet(values, proxy!.path);

			unset(values, getPxthSegments(proxy!.path));

			proxy!.setValue(
				proxy!.path,
				proxiedValue,
				(path, value) => {
					values = deepSet(values, path, isFunction(value) ? value(deepGet(values, path)) : value) as T;
				},
				getValue,
			);

			setValues(values);
		},
		[getValue, proxy, setValues],
	);

	if (!proxy) {
		return stock;
	}

	return {
		...stock,
		watch: interceptedWatch,
		watchEffect: interceptedWatchEffect,
		setValue: interceptedSetValue,
		getValue: interceptedGetValue,
		getValues: interceptedGetValues,
		setValues: interceptedSetValues,
	};
};
