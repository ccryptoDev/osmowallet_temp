import { ValueTransformer } from "typeorm";

export const numberTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};