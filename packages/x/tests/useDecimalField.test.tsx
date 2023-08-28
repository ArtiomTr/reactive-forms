import React from 'react';
import { ReactiveFormProvider, useForm } from '@reactive-forms/core';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
	DecimalFieldConfig,
	defaultErrorMessages,
	defaultFormatOptions,
	defaultLocales,
	useDecimalField,
} from '../src/useDecimalField';

type Config = Omit<DecimalFieldConfig, 'name'> & {
	initialValue?: number | null;
};

const renderUseDecimalField = (config: Config = {}) => {
	const { initialValue = 0, ...initialProps } = config;

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
				<ReactiveFormProvider formBag={formBag.result.current}>{children}</ReactiveFormProvider>
			),
			initialProps,
		},
	);

	return [decimalFieldBag, formBag] as const;
};

describe('Decimal field', () => {
	it('Should format initial value correctly', () => {
		const [{ result }] = renderUseDecimalField();

		expect(result.current.text).toBe((0).toLocaleString(defaultLocales, defaultFormatOptions));
		expect(result.current.value).toBe(0);
	});

	it('Should set default conversion error correctly', async () => {
		const [{ result }] = renderUseDecimalField();

		await act(() => {
			result.current.onTextChange('0a');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('a0');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.invalidInput);
		});

		await act(() => {
			result.current.onTextChange('hello');
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.invalidInput);
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
			expect(result.current.value).toBe(0);
			expect(result.current.meta.error?.$error).toBeUndefined();
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
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.required);
		});
	});

	it('Should set default error if field value is less than min', async () => {
		const [{ result }] = renderUseDecimalField({ min: 0.5 });

		act(() => {
			result.current.control.setValue(0.25);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.lessThanMinValue(0.5));
		});
	});

	it('Should set default error if field value is more than max', async () => {
		const [{ result }] = renderUseDecimalField({ max: 0.5 });

		act(() => {
			result.current.control.setValue(0.75);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe(defaultErrorMessages.moreThanMaxValue(0.5));
		});
	});

	it('Should set custom conversion error correctly', async () => {
		const [{ result }] = renderUseDecimalField({
			errorMessages: {
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
			errorMessages: { required: 'custom' },
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
			errorMessages: { lessThanMinValue: () => 'custom' },
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
			errorMessages: { moreThanMaxValue: () => 'custom' },
		});

		act(() => {
			result.current.control.setValue(0.75);
		});

		await waitFor(() => {
			expect(result.current.meta.error?.$error).toBe('custom');
		});
	});

	it('Should be able to format decimal differently', () => {
		const formatValue = jest.fn(() => 'custom');
		const initialValue = 3.14;
		const [{ result }] = renderUseDecimalField({ formatValue, initialValue });

		expect(result.current.text).toBe('custom');
		expect(formatValue).toBeCalledWith(initialValue);
	});

	it('Should call custom parseDecimal function', async () => {
		const parseDecimal = jest.fn();

		const [{ result }] = renderUseDecimalField({ parseDecimal });

		await act(() => {
			result.current.onTextChange('0.0');
		});

		await waitFor(() => {
			expect(parseDecimal).toBeCalledWith('0.0');
		});
	});
});
