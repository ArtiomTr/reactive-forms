import { FormPrivileges } from '../src/typings/FormPrivileges';

declare module '@reactive-forms/core' {
    interface FormShared<Values extends object> {
        privileges?: FormPrivileges<Values>;
    }

    interface ExtendableFormConfig<Values extends object> {
        privileges?: FormPrivileges<Values>;
    }
}
