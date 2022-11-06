import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import { ReactiveFormProvider, useForm, useFormContext } from '../../src';

describe('ReactiveFormProvider', () => {
	it('should pass context to children', () => {
		const { result: formBagResult } = renderHook(() => useForm({ initialValues: {} }));

		const wrapper = ({ children }: PropsWithChildren) => (
			<ReactiveFormProvider formBag={formBagResult.current}>{children}</ReactiveFormProvider>
		);

		const { result } = renderHook(() => useFormContext(), { wrapper });

		expect(result.current).toBe(formBagResult.current);
	});
});
