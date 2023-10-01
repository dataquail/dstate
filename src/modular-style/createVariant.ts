import { ZodTypeAny } from 'zod';

import { Transition } from 'src/modular-style/createTransition';

export type Variant = {
  schema: ZodTypeAny;
};

export const createVariant = <TVariantSchema extends ZodTypeAny>(
  schema: TVariantSchema,
) => {
  return {
    schema,
    createManifest: <
      TEventName extends string,
      TTransition extends Transition,
      NewVariant extends string,
      TIfCheck extends (...args: any[]) => boolean,
    >(
      manifestConfigList: {
        transition: { [k in TEventName]: TTransition };
        onResult: {
          if?: TIfCheck;
          goTo: NewVariant;
        }[];
      }[] = [],
    ) => {
      const transitionManifest = manifestConfigList.reduce(
        (acc, manifestConfig) => {
          const eventName = Object.keys(
            manifestConfig.transition,
          )[0] as TEventName;
          const invoke = manifestConfig.transition[eventName].invoke;
          acc[eventName] = {
            invoke,
            onResult: manifestConfig.onResult,
          };

          return acc;
        },
        {} as {
          [k in TEventName]?: {
            invoke: TTransition['invoke'];
            onResult: {
              if?: TIfCheck;
              goTo: NewVariant;
            }[];
          };
        },
      );

      return {
        transitions: transitionManifest,
        schema,
      };
    },
  };
};
