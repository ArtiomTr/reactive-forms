import { useCallback, useEffect, useRef } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import { BatchUpdate } from 'stocked';
import invariant from 'tiny-invariant';
import { Schema } from 'yup';

import { MorfixControl, useMorfixControl } from './useMorfixControl';
import { useValidationRegistry, ValidationRegistryControl } from './useValidationRegistry';
import { Empty, FieldValidator, MorfixErrors, MorfixTouched, SubmitAction } from '../typings';
import { deepRemoveEmpty } from '../utils/deepRemoveEmpty';
import { excludeOverlaps } from '../utils/excludeOverlaps';
import { runYupSchema } from '../utils/runYupSchema';
import { setNestedValues } from '../utils/setNestedValues';

export type MorfixConfig<Values extends object> = {
    initialValues: Values;
    initialTouched?: MorfixTouched<Values>;
    initialErrors?: MorfixErrors<Values>;
    schema?: Schema<Partial<Values> | undefined>;
    onSubmit?: SubmitAction<Values>;
    validateForm?: FieldValidator<Values>;
    shouldValidatePureFields?: boolean;
};

export type FieldObservers<V> = {
    valueObserver: (value: V) => void;
    errorObserver: (error: MorfixErrors<V> | undefined) => void;
    touchObserver: (touched: MorfixTouched<V> | undefined) => void;
    validator?: FieldValidator<V>;
};

export type MorfixResetConfig<V> = {
    initialValues?: V;
    initialTouched?: MorfixTouched<V>;
    initialErrors?: MorfixErrors<V>;
};

export type MorfixShared<Values extends object> = {
    submit: (action?: SubmitAction<Values>) => void;
    resetForm: (config?: MorfixResetConfig<Values>) => void;
} & MorfixControl<Values> &
    ValidationRegistryControl;

export const useMorfix = <Values extends object>({
    initialValues,
    initialErrors = {} as MorfixErrors<Values>,
    initialTouched = {} as MorfixTouched<Values>,
    onSubmit,
    schema,
    shouldValidatePureFields,
    validateForm: validateFormFn
}: MorfixConfig<Values>): MorfixShared<Values> => {
    const control = useMorfixControl({ initialValues, initialErrors, initialTouched });
    const validationRegistry = useValidationRegistry();

    const initialValuesRef = useRef(initialValues);
    const initialErrorsRef = useRef(initialErrors);
    const initialTouchedRef = useRef(initialTouched);

    initialValuesRef.current = initialValues;
    initialErrorsRef.current = initialErrors;
    initialTouchedRef.current = initialTouched;

    const { setFieldError, setErrors, setTouched, setValues, setFormMeta, getFormMeta, values, formMeta } = control;

    const {
        validateField: runFieldLevelValidation,
        validateAllFields,
        registerValidator: addValidatorToRegistry,
        unregisterValidator: removeValidatorFromRegistry,
        hasValidator
    } = validationRegistry;

    const validationValueObservers = useRef<Record<string, () => void>>({});

    const validateField = useCallback(
        async <V>(name: string, value: V) => {
            if (hasValidator(name)) {
                if (shouldValidatePureFields || !isEqual(value, get(initialValuesRef.current, name))) {
                    const error = await runFieldLevelValidation(name, value);
                    setFieldError(name, error);
                } else {
                    setFieldError(name, undefined);
                }
            }
        },
        [runFieldLevelValidation, setFieldError, hasValidator, shouldValidatePureFields]
    );

    const runFormValidationSchema = useCallback(
        (values: Values): Promise<MorfixErrors<Values> | undefined> => {
            if (!schema) return Promise.resolve(undefined);

            return runYupSchema(schema, values);
        },
        [schema]
    );

    const validateForm = useCallback(
        async (values: Values): Promise<MorfixErrors<Values>> => {
            const registryErrors = await validateAllFields(values);
            const validateFormFnErrors: MorfixErrors<Values> | Empty = await validateFormFn?.(values);
            const schemaErrors = await runFormValidationSchema(values);

            const allErrors = merge({}, registryErrors, validateFormFnErrors, schemaErrors);

            if (shouldValidatePureFields) {
                return allErrors;
            } else {
                return excludeOverlaps(values, initialValuesRef.current, allErrors) as MorfixErrors<Values>;
            }
        },
        [runFormValidationSchema, validateAllFields, validateFormFn, shouldValidatePureFields]
    );

    const submit = useCallback(
        async (action: SubmitAction<Values> | undefined = onSubmit) => {
            invariant(
                action,
                'Cannot call submit, because no action specified in arguments and no default action provided.'
            );

            setFormMeta('submitCount', getFormMeta<number>('submitCount') + 1);
            setFormMeta('isSubmitting', true);
            setFormMeta('isValidating', true);

            const currentValues = values.getValues();

            const newErrors = await validateForm(currentValues);

            setFormMeta('isValidating', false);

            setErrors(newErrors);
            setTouched(setNestedValues(currentValues, { mrfxTouched: true }));

            if (Object.keys(newErrors).length === 0) {
                await action(currentValues);
                setFormMeta('isSubmitting', true);
            }
        },
        [onSubmit, setFormMeta, getFormMeta, values, validateForm, setErrors, setTouched]
    );

    const registerValidator = useCallback(
        <V>(name: string, validator: FieldValidator<V>) => {
            addValidatorToRegistry(name, validator);
            if (!Object.prototype.hasOwnProperty.call(validationValueObservers.current, name)) {
                validationValueObservers.current[name] = values.watch(name, (value) => validateField(name, value));
            }
        },
        [addValidatorToRegistry, validateField, values]
    );

    const unregisterValidator = useCallback(
        <V>(name: string, validator: FieldValidator<V>) => {
            removeValidatorFromRegistry(name, validator);
            if (!hasValidator(name) && Object.prototype.hasOwnProperty.call(validationValueObservers, name)) {
                validationValueObservers.current[name]();
                delete validationValueObservers.current[name];
            }
        },
        [hasValidator, removeValidatorFromRegistry]
    );

    const updateFormDirtiness = useCallback(
        ({ values }: BatchUpdate<unknown>) => setFormMeta('dirty', !isEqual(values, initialValuesRef.current)),
        [setFormMeta]
    );

    const updateFormValidness = useCallback(
        ({ values }: BatchUpdate<object>) => setFormMeta('isValid', deepRemoveEmpty(values) === undefined),
        [setFormMeta]
    );

    const resetForm = useCallback(
        ({ initialErrors, initialTouched, initialValues }: MorfixResetConfig<Values> = {}) => {
            setValues(initialValues ?? initialValuesRef.current);
            setTouched(initialTouched ?? initialTouchedRef.current);
            setErrors(initialErrors ?? initialErrorsRef.current);
        },
        [setValues, setTouched, setErrors]
    );

    useEffect(() => values.watchBatchUpdates(updateFormDirtiness), [values, updateFormDirtiness]);

    useEffect(
        () =>
            formMeta.watchBatchUpdates((batchUpdate) => {
                const newPaths = batchUpdate.paths.filter((path) => path.indexOf('errors') === 0);

                if (newPaths.length > 0) {
                    updateFormValidness({
                        ...batchUpdate,
                        paths: newPaths
                    });
                }
            }),
        [formMeta, updateFormValidness]
    );

    return {
        submit,
        resetForm,
        ...validationRegistry,
        registerValidator,
        unregisterValidator,
        ...control
    };
};
