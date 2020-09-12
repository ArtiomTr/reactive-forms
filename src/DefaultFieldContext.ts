import { useMorfixContext } from './MorfixContext';
import { FieldContext } from './types';
import { get } from 'lodash';
import { useCallback } from 'react';

export const useDefaultFieldContext = <V>(name: string): FieldContext<V> => {
    const { values, initialValues, setFieldValue } = useMorfixContext();

    const setValue = useCallback((value: V) => setFieldValue(name, value), [
        name
    ]);

    return [
        {
            value: get(values, name),
            initialValue: get(initialValues, name)
        },
        { setValue }
    ];
};
