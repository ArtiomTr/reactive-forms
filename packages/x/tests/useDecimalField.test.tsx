import React from 'react';
import { ReactiveFormProvider, useForm } from '@reactive-forms/core';
import { act, renderHook, waitFor } from '@testing-library/react';

import { DecimalFieldI18n, DecimalFieldI18nContextProvider, defaultDecimalFieldI18n } from '../src/DecimalFieldI18n';
import { formatDecimal } from '../src/formatDecimal';
import { DecimalFieldConfig, defaultPrecision, useDecimalField } from '../src/useDecimalField';

type Config = Omit<DecimalFieldConfig, 'name'> & {
	initialValue?: number | null;
	i18n?: Partial<DecimalFieldI18n>;
};

const renderUseDecimalField = (config: Config = {}) => {
	const { initialValue = 0, i18n, ...initialProps } = config;

	const formBag = renderHook(() =>
		useForm({
			initialValues: {
				test: initialValue,
			},
		}),
	);

	const decimalFieldBag = renderHook(
		(props: Omit<DecimalFieldConfig, 'name'>) =>
			useDecimalField({
				name: formBag.result.current.paths.test,
				...props,
			}),
		{
			wrapper: ({ children }) => (
				<ReactiveFormProvider formBag={formBag.result.current}>
					<DecimalFieldI18nContextProvider i18n={i18n}>{children}</DecimalFieldI18nContextProvider>
				</ReactiveFormProvider>
			),
			initialProps,
		},
	);

	return [decimalFieldBag, formBag] as const;
};

describe('Decimal field', () => {
	it('Should format initial value correctly', () => {
		const [{ result }] = renderUseDecimalField();

		expect(result.current.text).toBe(formatDecimal(0, defaultPrecision));
		expect(result.current.value).toBe(0);
	});

	it('Should set default conversion error correctly', async () => {
		const [{ result }] = renderUseDecimalField();

		await act(() => {
			result.current.onTextChange('0a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('a0');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('hello');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('0');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		await act(() => {
			result.current.onTextChange('');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(null);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		await act(() => {
			result.current.onTextChange('     ');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(null);
			expect(result.current.text).toBe('     ');
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		await act(() => {
			result.current.onTextChange('.');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(null);
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('.0');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		await act(() => {
			result.current.onTextChange('0.');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});

		await act(() => {
			result.current.onTextChange('0.0');
		});

		await waitFor(() => {
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if field is required and empty', async () => {
		const [{ result }] = renderUseDecimalField({ required: true });

		act(() => {
			result.current.control.setValue(null);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.required);
		});
	});

	it('Should set default error if field value is less than min', async () => {
		const [{ result }] = renderUseDecimalField({ min: 0.5 });

		act(() => {
			result.current.control.setValue(0.25);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.minValue(0.5, defaultPrecision));
		});

		act(() => {
			result.current.control.setValue(0.5);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set default error if field value is more than max', async () => {
		const [{ result }] = renderUseDecimalField({ max: 0.5 });

		act(() => {
			result.current.control.setValue(0.75);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultDecimalFieldI18n.maxValue(0.5, defaultPrecision));
		});

		act(() => {
			result.current.control.setValue(0.5);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBeUndefined();
		});
	});

	it('Should set custom conversion error correctly', async () => {
		const [{ result }] = renderUseDecimalField({
			i18n: {
				invalidInput: 'custom',
			},
		});

		await act(() => {
			result.current.onTextChange('0a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		await act(() => {
			result.current.onTextChange('a0');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});

		await act(() => {
			result.current.onTextChange('hello');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should set custom error if field is required and empty', async () => {
		const [{ result }] = renderUseDecimalField({
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
		const [{ result }] = renderUseDecimalField({
			min: 0.5,
			i18n: {
				minValue: () => 'custom',
			},
		});

		act(() => {
			result.current.control.setValue(0.25);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should set custom error if field value is more than max', async () => {
		const [{ result }] = renderUseDecimalField({
			max: 0.5,
			i18n: {
				maxValue: () => 'custom',
			},
		});

		act(() => {
			result.current.control.setValue(0.75);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should call custom format function', () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const format = jest.fn((_value: number | null | undefined) => 'custom');
		const initialValue = 3.14;
		const [{ result }] = renderUseDecimalField({ format, initialValue });

		expect(result.current.text).toBe('custom');
		expect(format.mock.calls[0][0]).toBe(initialValue);
	});

	it('Should call custom parse function', async () => {
		const parse = jest.fn();

		const [{ result }] = renderUseDecimalField({ parse });

		await act(() => {
			result.current.onTextChange('0.0');
		});

		await waitFor(() => {
			expect(parse).toBeCalledWith('0.0');
		});
	});
});
