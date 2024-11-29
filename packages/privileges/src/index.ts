import { FormPrivileges } from './typings/FormPrivileges';

export * from './plugin';
export * from './getFieldPrivileges';
export * from './useFieldPrivileges';

// typings
export * from './typings/FieldPrivileges';
export * from './typings/ObjectPrivileges';
export * from './typings/Privileges';
export * from './typings/FormPrivileges';

declare module '@reactive-forms/core' {
    interface FormShared<Values extends object> {
        privileges?: FormPrivileges<Values>;
    }

    interface ExtendableFormConfig<Values extends object> {
        privileges?: FormPrivileges<Values>;
    }
}
