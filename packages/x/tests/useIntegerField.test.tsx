import React from 'react';
import { ReactiveFormProvider, useForm } from '@reactive-forms/core';
import { act, renderHook, waitFor } from '@testing-library/react';

import { defaultIntegerFieldI18n, IntegerFieldI18n, IntegerFieldI18nContextProvider } from '../src/IntegerFieldI18n';
import { IntegerFieldConfig, useIntegerField } from '../src/useIntegerField';

type Config = Omit<IntegerFieldConfig, 'name'> & {
	initialValue?: number | null;
	i18n?: Partial<IntegerFieldI18n>;
};

const renderUseIntegerField = (config: Config = {}) => {
	const { initialValue = 0, i18n, ...initialProps } = config;

	const formBag = renderHook(() =>
		useForm({
			initialValues: {
				test: initialValue,
			},
		}),
	);

	const result = renderHook(
		(props: Omit<IntegerFieldConfig, 'name'>) =>
			useIntegerField({
				name: formBag.result.current.paths.test,
				...props,
			}),
		{
			wrapper: ({ children }) => (
				<ReactiveFormProvider formBag={formBag.result.current}>
					<IntegerFieldI18nContextProvider i18n={i18n}>{children}</IntegerFieldI18nContextProvider>
				</ReactiveFormProvider>
			),
			initialProps,
		},
	);

	return [result, formBag] as const;
};

describe('Integer field', () => {
	it('Should format initial value correctly', () => {
		const [{ result }] = renderUseIntegerField();

		expect(result.current.text).toBe('0');
		expect(result.current.value).toBe(0);
	});

	it('Should set default error in case of conversion error and clear it afterwards', async () => {
		const [{ result }] = renderUseIntegerField();

		act(() => {
			result.current.onTextChange('0a');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBe(defaultIntegerFieldI18n.invalidInput);
		});

		act(() => {
			result.current.onTextChange('a0');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBe(defaultIntegerFieldI18n.invalidInput);
		});

		act(() => {
			result.current.onTextChange('1');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(1);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if field is required and empty', async () => {
		const [{ result }] = renderUseIntegerField({ required: true });

		act(() => {
			result.current.control.setValue(null);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultIntegerFieldI18n.required);
		});
	});

	it('Should set default error if field value is less than min', async () => {
		const [{ result }] = renderUseIntegerField({ min: 0 });

		act(() => {
			result.current.control.setValue(-1);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultIntegerFieldI18n.minValue(0));
		});

		act(() => {
			result.current.control.setValue(0);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if field value is more than max', async () => {
		const [{ result }] = renderUseIntegerField({ max: 0 });

		act(() => {
			result.current.control.setValue(1);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultIntegerFieldI18n.maxValue(0));
		});

		act(() => {
			result.current.control.setValue(0);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom error in case of conversion error and clear it afterwards', async () => {
		const [{ result }] = renderUseIntegerField({
			i18n: {
				invalidInput: 'custom',
			},
		});

		act(() => {
			result.current.onTextChange('0a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.onTextChange('a0');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		act(() => {
			result.current.onTextChange('0');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom error if field is required and empty', async () => {
		const [{ result }] = renderUseIntegerField({
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
	});

	it('Should set custom error if field value is less than min', async () => {
		const minValue = jest.fn(() => 'custom');

		const [{ result }] = renderUseIntegerField({
			min: 0,
			i18n: {
				minValue,
			},
		});

		act(() => {
			result.current.control.setValue(-1);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
			expect(minValue).toBeCalledWith(0);
		});
	});

	it('Should set custom error if field value is more than max', async () => {
		const maxValue = jest.fn(() => 'custom');

		const [{ result }] = renderUseIntegerField({
			max: 0,
			i18n: {
				maxValue,
			},
		});

		act(() => {
			result.current.control.setValue(1);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
			expect(maxValue).toBeCalledWith(0);
		});
	});

	it('Should be able to format integer differently', () => {
		const format = jest.fn(() => 'custom');
		const initialValue = 42;
		const [{ result }] = renderUseIntegerField({ format, initialValue });

		expect(result.current.text).toBe('custom');
		expect(format).toBeCalledWith(initialValue);
	});

	it('Should call custom parse function', async () => {
		const parse = jest.fn();

		const [{ result }] = renderUseIntegerField({ parse });

		await act(() => {
			result.current.onTextChange('0');
		});

		await waitFor(() => {
			expect(parse).toBeCalledWith('0');
		});
	});
});
