import React from 'react';
import { ReactiveFormProvider, useForm } from '@reactive-forms/core';
import { act, renderHook, waitFor } from '@testing-library/react';

import { defaultStringFieldI18n, StringFieldI18n, StringFieldI18nContextProvider } from '../src/StringFieldI18n';
import { StringFieldConfig, useStringField } from '../src/useStringField';

type Config = Omit<StringFieldConfig, 'name'> & {
	initialValue?: string;
	i18n?: Partial<StringFieldI18n>;
};

const renderUseStringField = (config: Config = {}) => {
	const { initialValue = '', i18n, ...initialProps } = config;

	const formBag = renderHook(() =>
		useForm({
			initialValues: {
				test: initialValue,
			},
		}),
	);

	const stringFieldBag = renderHook(
		(props: Omit<StringFieldConfig, 'name'>) =>
			useStringField({
				name: formBag.result.current.paths.test,
				...props,
			}),
		{
			wrapper: ({ children }) => (
				<ReactiveFormProvider formBag={formBag.result.current}>
					<StringFieldI18nContextProvider i18n={i18n}>{children}</StringFieldI18nContextProvider>
				</ReactiveFormProvider>
			),
			initialProps,
		},
	);

	return [stringFieldBag, formBag] as const;
};

describe('String field', () => {
	it('Should set touched=true on blur', async () => {
		const [{ result }] = renderUseStringField();

		await act(() => {
			result.current.onBlur();
		});

		await waitFor(() => {
			expect(result.current.meta.touched?.$touched).toBeTruthy();
		});
	});

	it('Should set default error if field is required and empty', async () => {
		const [{ result }] = renderUseStringField({ required: true });

		act(() => {
			result.current.control.setValue(null);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue(undefined);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue('');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue('   ');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.required);
		});

		act(() => {
			result.current.control.setValue('a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if value is longer than maxLength', async () => {
		const [{ result }] = renderUseStringField({ maxLength: 3 });

		act(() => {
			result.current.control.setValue('aaaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.maxLength(3));
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if value is shorter than minLength', async () => {
		const [{ result }] = renderUseStringField({ minLength: 3 });

		act(() => {
			result.current.control.setValue('aa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultStringFieldI18n.minLength(3));
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom error if field is required and empty', async () => {
		const [{ result }] = renderUseStringField({
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
			result.current.control.setValue('');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.control.setValue('   ');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.control.setValue('a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom error if value is longer than maxLength', async () => {
		const [{ result }] = renderUseStringField({
			maxLength: 3,
			i18n: {
				maxLength: () => 'custom',
			},
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		act(() => {
			result.current.control.setValue('aaaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should set custom error if value is longer than maxLength (with callback)', async () => {
		const callback = jest.fn(() => 'custom');
		const [{ result }] = renderUseStringField({
			maxLength: 3,
			i18n: {
				maxLength: callback,
			},
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		act(() => {
			result.current.control.setValue('aaaa');
		});

		await waitFor(() => {
			expect(callback).toBeCalledWith(3);
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should set custom error if value is shorter than minLength', async () => {
		const [{ result }] = renderUseStringField({
			minLength: 3,
			i18n: {
				minLength: () => 'custom',
			},
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		act(() => {
			result.current.control.setValue('aa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should set custom error if value is shorter than minLength', async () => {
		const callback = jest.fn(() => 'custom');
		const [{ result }] = renderUseStringField({
			minLength: 3,
			i18n: {
				minLength: callback,
			},
		});

		act(() => {
			result.current.control.setValue('aaa');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		act(() => {
			result.current.control.setValue('aa');
		});

		await waitFor(() => {
			expect(callback).toBeCalledWith(3);
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});
});
