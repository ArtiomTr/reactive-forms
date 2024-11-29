import React from 'react';
import { ReactiveFormProvider, useForm } from '@reactive-forms/core';
import { act, renderHook, waitFor } from '@testing-library/react';

import { BooleanFieldI18n, BooleanFieldI18nContextProvider, defaultBooleanFieldI18n } from '../src/BooleanFieldI18n';
import { BooleanFieldConfig, useBooleanField } from '../src/useBooleanField';

type Config = Omit<BooleanFieldConfig, 'name'> & {
	initialValue?: boolean;
	i18n?: Partial<BooleanFieldI18n>;
};

const renderUseBooleanField = (config: Config = {}) => {
	const { initialValue = false, i18n, ...initialProps } = config;

	const formBag = renderHook(() =>
		useForm({
			initialValues: {
				test: initialValue,
			},
		}),
	);

	const stringFieldBag = renderHook(
		(props: Omit<BooleanFieldConfig, 'name'>) =>
			useBooleanField({
				name: formBag.result.current.paths.test,
				...props,
			}),
		{
			wrapper: ({ children }) => (
				<ReactiveFormProvider formBag={formBag.result.current}>
					<BooleanFieldI18nContextProvider i18n={i18n}>{children}</BooleanFieldI18nContextProvider>
				</ReactiveFormProvider>
			),
			initialProps,
		},
	);

	return [stringFieldBag, formBag] as const;
};

describe('Boolean field', () => {
	it('Should set touched=true on blur', async () => {
		const [{ result }] = renderUseBooleanField();

		expect(result.current.meta.touched?.$touched).toBeFalsy();

		await act(() => {
			result.current.onBlur();
		});

		await waitFor(() => {
			expect(result.current.meta.touched?.$touched).toBeTruthy();
		});
	});

	it('Should set default error if field is required and empty', async () => {
		const [{ result }] = renderUseBooleanField({ required: true });

		act(() => {
			result.current.control.setValue(null);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultBooleanFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue(undefined);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultBooleanFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue(false);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultBooleanFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue(true);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom error if field is required and empty', async () => {
		const [{ result }] = renderUseBooleanField({
			required: true,
			i18n: {
				required: 'custom',
			},
		});

		act(() => {
			result.current.control.setValue(null);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.control.setValue(undefined);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.control.setValue(false);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.control.setValue(true);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});
});
