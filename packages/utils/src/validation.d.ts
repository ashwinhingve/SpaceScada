import { DataType, TagValue } from '@webscada/shared-types';
export declare const validateTagValue: (value: unknown, dataType: DataType) => boolean;
export declare const coerceTagValue: (value: unknown, dataType: DataType) => TagValue;
export declare const isValidIpAddress: (ip: string) => boolean;
export declare const isValidPort: (port: number) => boolean;
export declare const isValidEmail: (email: string) => boolean;
//# sourceMappingURL=validation.d.ts.map
