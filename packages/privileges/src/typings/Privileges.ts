import { FieldPrivileges } from './FieldPrivileges';
import { ObjectPrivileges } from './ObjectPrivileges';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type Privileges<T> = T extends Primitive ? FieldPrivileges : FieldPrivileges & ObjectPrivileges<T>;
