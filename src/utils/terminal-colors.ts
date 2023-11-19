// this utility is used for remvoing chalk from the dependency list
export const bold = (str: unknown) => `\x1b[1m${str}\x1b[21m`;
export const blue = (str: unknown) => `\x1b[34m${str}\x1b[39m`;
export const cyan = (str: unknown) => `\x1b[36m${str}\x1b[39m`;
export const green = (str: unknown) => `\x1b[32m${str}\x1b[39m`;
export const yellow = (str: unknown) => `\x1b[33m${str}\x1b[39m`;
export const red = (str: unknown) => `\x1b[31m${str}\x1b[39m`;
