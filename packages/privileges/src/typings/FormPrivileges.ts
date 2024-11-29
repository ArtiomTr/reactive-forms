import { Privileges } from './Privileges';

export type FormPrivileges<T extends object> = {
    fields: Privileges<T>;
};
