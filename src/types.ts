import { Schema } from 'yup';

export type MorfixContextType<Values extends MorfixValues> = {
    values: Values;
    errors: MorfixErrors<Values>;
    initialValues: Values;
} & MorfixControl<Values>;

export type MorfixShared<Values extends MorfixValues> = MorfixContextType<Values>;

export type MorfixValues = object;

export type SubmitAction<Values extends MorfixValues> = (values: Values, control: MorfixControl<Values>) => void;

export interface FieldError {
    message: string;
}

export type MorfixInnerError = {
    error_mrfx?: FieldError;
};

export type MorfixErrors<Values> = MorfixInnerError &
    {
        [K in keyof Values]?: Values[K] extends object
            ? Values[K] extends unknown[]
                ? MorfixErrors<Values[K][number]>[] &
                      MorfixInnerError /** TODO: think about how to do not mutate array */
                : MorfixErrors<Values[K]>
            : MorfixInnerError;
    };

export interface MorfixControl<Values extends MorfixValues> {
    setFieldValue: <T>(name: string, value: T) => void;
    setValues: (values: Values) => void;
    registerFieldValidator: <T>(name: string, validator: FieldValidator<T>) => void;
    unregisterFieldValidator: (name: string) => void;
    submitForm: (submitAction?: SubmitAction<Values>) => Promise<void>;
}

export interface FieldHandlers<V> {
    setValue: (value: V) => void;
}

export interface FieldMeta<T> {
    value: T;
    initialValue: T;
    error: MorfixErrors<T>;
}

export type FieldContext<T> = [FieldMeta<T>, FieldHandlers<T>];

type NotRequired<T> = null | undefined | T;

export type FieldValidator<T> = (value: T) => Promise<NotRequired<MorfixErrors<T>>> | NotRequired<MorfixErrors<T>>;

export type ValidationRegistry = Record<string, FieldValidator<unknown>>;

export interface SharedFieldConfig<V> {
    name: string;
    validate?: FieldValidator<V>;
    validationSchema?: Schema<Partial<V> | undefined>;
}

export interface FieldProps {
    name: string;
    value: string;
    error?: FieldError;
    onChange: (e: React.ChangeEvent<{ value: string }>) => void;
    onBlur?: (e: React.FocusEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
}
