import { Privileges } from './Privileges';

export type ObjectPrivileges<T> = {
    [P in keyof T]?: Privileges<T[P] extends Array<unknown> ? T[P][0] : T[P]>;
};
