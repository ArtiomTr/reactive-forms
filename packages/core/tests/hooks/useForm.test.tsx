import { act, renderHook } from '@testing-library/react';
import { createPxth, Pxth } from 'pxth';
import { Stock } from 'stocked';

import { FieldError, useForm } from '../../src';

const waitForStockValueUpdate = (stock: Stock<object>, path: Pxth<unknown>) => {
	return new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Time-out - field update took longer than 1 second')), 1000);
		const watchCleanup = stock.watch(path, () => {
			clearTimeout(timeout);
			resolve();
			watchCleanup();
		});
	});
};

describe('validateUpdatedFields', () => {
	it('should run field-level validations when field value changes', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {},
			}),
		);

		const somePxth = createPxth(['some', 'deep', 'path']);

		const validator = jest.fn();
		validator.mockReturnValue('error');

		const cleanup = result.current.registerValidator(somePxth, validator);
		result.current.setFieldValue(somePxth, 'asdf');

		await waitForStockValueUpdate(result.current.errors, somePxth);

		expect(result.current.getFieldError(somePxth)).toStrictEqual({
			$error: 'error',
		});

		act(() => {
			cleanup();
		});
	});
	it('should run field-level validations when parent value changes', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {},
			}),
		);

		const somePxth = createPxth(['some', 'deep', 'path']);

		const validator = jest.fn();
		validator.mockReturnValue('error');

		const cleanup = result.current.registerValidator(somePxth, validator);
		result.current.setFieldValue(createPxth(['some']), { deep: { path: 'asdf' } });

		await waitForStockValueUpdate(result.current.errors, somePxth);

		expect(result.current.getFieldError(somePxth)).toStrictEqual({
			$error: 'error',
		});

		act(() => {
			cleanup();
		});
	});
});

describe('validateField', () => {
	it('should run field-level validation', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {},
			}),
		);

		const validator = jest.fn();
		validator.mockReturnValueOnce('error');

		let cleanup: () => void;

		act(() => {
			cleanup = result.current.registerValidator(createPxth(['custom', 'name']), validator);
		});

		await expect(
			result.current.validateField(createPxth(['custom', 'name']), { value: 'asdf' }),
		).resolves.toStrictEqual({
			$error: 'error',
		});

		expect(validator).toBeCalledWith({
			value: 'asdf',
		});

		validator.mockClear();
		validator.mockReturnValueOnce({ $error: 'newError' });

		await expect(result.current.validateField(createPxth<{}>(['custom', 'name']), {})).resolves.toStrictEqual({
			$error: 'newError',
		});

		validator.mockClear();
		validator.mockReturnValueOnce(null);

		await expect(result.current.validateField(createPxth<{}>(['custom', 'name']), {})).resolves.toStrictEqual({
			$error: undefined,
		});

		act(() => {
			cleanup();
		});
	});

	it('should return undefined, but not modify errors, if validator is not defined', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					custom: {
						name: 'User',
					},
				},
				initialErrors: {
					custom: {
						name: {
							$error: 'Error',
						},
					},
				},
			}),
		);

		await expect(result.current.validateField(createPxth(['custom', 'name']), 0)).resolves.toBe(undefined);

		expect(result.current.getFieldError(createPxth(['custom', 'name']))).toStrictEqual({ $error: 'Error' });
	});

	it('should return undefined and clear error if validator returned nothing', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					custom: {
						name: 'User',
					},
				},
				initialErrors: {
					custom: {
						name: {
							$error: 'Error',
						},
					},
				},
			}),
		);

		let cleanup: () => void;

		const validator = jest.fn();

		act(() => {
			cleanup = result.current.registerValidator(createPxth(['custom', 'name']), validator);
		});

		await expect(result.current.validateField(createPxth(['custom', 'name']), 0)).resolves.toStrictEqual({
			$error: undefined,
		});

		expect(validator).toBeCalled();
		expect(result.current.getFieldError(createPxth(['custom', 'name']))).toStrictEqual({ $error: undefined });

		act(() => {
			cleanup();
		});
	});

	it('should clear error if disablePureFieldsValidation enabled & value is equal to initial value', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					custom: {
						name: {
							inner: {
								value: 'a',
							},
						},
					},
				},
				initialErrors: {
					custom: {
						name: {
							$error: 'Error',
							inner: {
								$error: 'Error',
								value: {
									$error: 'Error',
								},
							},
						},
					},
				},
				disablePureFieldsValidation: true,
			}),
		);

		let cleanup: () => void;

		const validator = jest.fn();

		act(() => {
			cleanup = result.current.registerValidator(createPxth(['custom', 'name']), validator);
		});

		await expect(
			result.current.validateField(createPxth(['custom', 'name']), {
				inner: {
					value: 'a',
				},
			}),
		).resolves.toStrictEqual(undefined);

		expect(validator).not.toBeCalled();
		expect(result.current.getFieldError(createPxth(['custom', 'name']))).toStrictEqual({ $error: undefined });

		act(() => {
			cleanup();
		});
	});
});

describe('validateForm', () => {
	it('should call all registered validators', async () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					hello: 'asdf',
					deep: {
						value: 'asdf',
					},
					array: ['asdf'] as Array<undefined | string>,
				},
			}),
		);

		const validator1 = jest.fn();
		const validator2 = jest.fn();
		const validator3 = jest.fn();
		const validator4 = jest.fn();

		act(() => {
			result.current.registerValidator(createPxth(['hello']), validator1);
			result.current.registerValidator(createPxth(['deep', 'value']), validator2);
			result.current.registerValidator(createPxth(['array', '1']), validator3);
			result.current.registerValidator(createPxth(['not', 'existing', 'value']), validator4);
		});

		await act(async () => {
			await result.current.submit();
		});

		validator1.mockReturnValueOnce('Error1');
		validator2.mockReturnValueOnce(undefined);
		validator3.mockReturnValueOnce({ $error: 'Error2' });
		validator4.mockReturnValueOnce({ $error: 'Error3' });

		await expect(
			result.current.validateForm({
				hello: 'value1',
				deep: {
					value: 'value2',
				},
				array: [undefined, 'value3'],
			}),
		).resolves.toStrictEqual({
			hello: {
				$error: 'Error1',
			},
			array: [
				undefined,
				{
					$error: 'Error2',
				},
			],
			not: {
				existing: {
					value: {
						$error: 'Error3',
					},
				},
			},
		});

		expect(validator1).toBeCalledWith('value1');
		expect(validator2).toBeCalledWith('value2');
		expect(validator3).toBeCalledWith('value3');
		expect(validator4).toBeCalledWith(undefined);
	});

	it('should run validateForm function', async () => {
		const validateForm = jest.fn();

		validateForm.mockReturnValueOnce({
			$error: null,
			value: {
				$error: 'New error!!!',
			},
		});

		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					value: 'asdf',
				},
				validateForm,
			}),
		);

		await expect(
			result.current.validateForm({
				value: 'New value',
			}),
		).resolves.toStrictEqual({
			value: {
				$error: 'New error!!!',
			},
		});

		expect(validateForm).toBeCalledWith({
			value: 'New value',
		});
	});
});

describe('should merge errors correctly', () => {
	it('should merge errors attached to arrays', async () => {
		const onSubmit = jest.fn();

		const { result } = renderHook(() =>
			useForm<{ arr: unknown[][] }>({
				initialValues: {
					arr: [[]],
				},
				validateForm: (values) => {
					if (values.arr[0].length === 0) {
						const arrError: FieldError<string[][]> = [];
						const innerError: FieldError<string[]> = [];

						arrError.$error = 'Error';
						innerError.$error = 'Inner error';

						arrError.push(innerError);

						return {
							arr: arrError,
						};
					}

					return {};
				},
				onSubmit,
			}),
		);

		await act(async () => {
			await result.current.submit();
		});

		expect(result.current.getFieldError(createPxth(['arr'])).$error).toBe('Error');
		expect(result.current.getFieldError(createPxth(['arr', '0'])).$error).toBe('Inner error');
		expect(onSubmit).toBeCalledTimes(0);
	});

	it('should merge errors attached to arrays', async () => {
		const onSubmit = jest.fn();

		const { result } = renderHook(() =>
			useForm<{ load_models: unknown[] }>({
				initialValues: {
					load_models: [],
				},
				validateForm: (values) => {
					if (values.load_models.length === 0) {
						const arrError: FieldError<string[]> = [];

						arrError.$error = 'Error';

						return {
							load_models: arrError,
						};
					}

					return {};
				},
				onSubmit,
			}),
		);

		await act(async () => {
			await result.current.submit();
		});

		expect(result.current.getFieldError(createPxth(['load_models'])).$error).toBe('Error');
		expect(onSubmit).toBeCalledTimes(0);
	});
});
