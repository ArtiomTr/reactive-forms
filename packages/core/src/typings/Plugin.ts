import { FormConfig, FormShared } from '../hooks/useForm';

export type Plugin = {
    token: Symbol;
    useBagDecorator: <T extends object>(form: FormShared<T>, config: FormConfig<T>) => FormShared<T>;
    useConfigDecorator: <T extends object>(config: FormConfig<T>) => FormConfig<T>;
};
