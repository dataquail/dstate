import { ZodTypeAny } from 'zod';

type OptionalKeys<T> = Exclude<
  { [P in keyof T]: undefined extends T[P] ? P : never }[keyof T],
  undefined
>;

type primitive = string | number | boolean | undefined | null;
type PickOptionalProperties<T> = T extends primitive
  ? T
  : T extends Array<infer U>
  ? PickOptionalPropertiesArray<U>
  : PickOptionalPropertiesObject<T>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PickOptionalPropertiesArray<T>
  extends ReadonlyArray<PickOptionalProperties<T>> {}

type PickOptionalPropertiesObject<T> = {
  readonly [P in OptionalKeys<T>]: PickOptionalProperties<
    Exclude<T[P], undefined>
  >;
};

export const createModel = <
  TVariantName extends string,
  TTransitionName extends string,
  TSchema extends ZodTypeAny,
  Targs extends any[],
  TConfig extends {
    [variant in TVariantName]: {
      transitions: PickOptionalProperties<{
        [transition in TTransitionName]: {
          invoke: (
            currentData: ReturnType<TConfig[variant]['schema']['parse']>,
            ...args: Targs
          ) => any;
          onResult: {
            // TODO: Fix this to infer correct arg type
            if?: (
              // data: ReturnType<
              //   TConfig[variant]['transitions'][transition]['invoke']
              // >,
              data: any,
            ) => boolean;
            goTo: keyof TConfig;
          }[];
        };
      }>;
      schema: TSchema;
    };
  },
>(
  config: TConfig,
) => {
  return {
    asVariant: (
      variantName: keyof typeof config,
      variantData: (typeof config)[TVariantName]['schema'],
    ) => {
      return {
        variantName,
        variantData,
      };
    },
  };
};
