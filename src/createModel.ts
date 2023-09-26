import { ZodObject, ZodRawShape } from 'zod';

import {
  DomainInvariantViolationError,
  UnexpectedError,
  isError,
} from 'src/errors';

export type Event<TType, TArgs> = { type: TType; args: TArgs };

type UnexpectedErrorKind = {
  variantName: 'unknown';
  variantData: UnexpectedError;
};

type DomainInvariantViolationErrorKind = {
  variantName: 'unknown';
  variantData: DomainInvariantViolationError;
};

export const createModel = <
  TEvents extends Event<string, any>,
  TVariantSchema extends ZodRawShape,
  TConfig extends {
    manifest: {
      variants: {
        [k in keyof TConfig['manifest']['variants']]: ZodObject<TVariantSchema>;
      };
      eventSchema: TEvents;
    };
    variantMap: {
      [variant in keyof TConfig['manifest']['variants']]: {
        [e in TEvents['type']]: {
          invoke: (
            currentData: ReturnType<
              TConfig['manifest']['variants'][variant]['parse']
            >,
          ) => any;
          onResult: {
            cond?: (data: any) => boolean;
            target: keyof TConfig['manifest']['variants'];
          }[];
        };
      };
    };
  },
>(
  config: TConfig,
) => {
  return {
    asVariant: <
      TVariantNames extends keyof TConfig['manifest']['variants'],
      TInputData extends ReturnType<
        TConfig['manifest']['variants'][TVariantNames]['parse']
      >,
    >(
      variant: TVariantNames,
      data: TInputData,
    ): {
      variantName: typeof variant;
      variantData: ReturnType<
        TConfig['manifest']['variants'][typeof variant]['parse']
      >;
      send: (event: keyof TConfig['variantMap'][typeof variant]) =>
        | UnexpectedErrorKind
        | DomainInvariantViolationErrorKind
        | {
            variantName: TConfig['variantMap'][typeof variant][keyof TConfig['variantMap'][typeof variant]]['onResult'][number]['target'];
            variantData: ReturnType<
              TConfig['manifest']['variants'][TConfig['variantMap'][typeof variant][keyof TConfig['variantMap'][typeof variant]]['onResult'][number]['target']]['parse']
            >;
            send: (
              e: keyof TConfig['variantMap'][typeof variant],
            ) =>
              | UnexpectedErrorKind
              | DomainInvariantViolationErrorKind
              | unknown;
          };
    } => {
      if (!config.manifest.variants[variant]) {
        throw new Error(
          `Unable to instantiate unrecognized variant: ${String(variant)}`,
        );
      } else if (
        config.manifest.variants[variant].safeParse(data).success === false
      ) {
        throw new Error(
          `Unable to instantiate variant: ${String(
            variant,
          )} due to invalid initial data`,
        );
      }

      const send = (event: keyof TConfig['variantMap'][typeof variant]) => {
        const currentVariantMap = config.variantMap[
          variant
        ] as TConfig['variantMap'][TVariantNames];

        const eventMap = currentVariantMap[event];
        if (!eventMap) {
          throw new Error(
            `Unrecognized event: ${String(event)} for variant: ${String(
              variant,
            )}`,
          );
        }

        try {
          const newData = eventMap.invoke(data);
          const newVariant = eventMap.onResult.find((result) => {
            if (result.cond) {
              return result.cond(newData);
            }
            return true;
          })?.target;

          if (!newVariant) {
            throw new Error(
              `Event: ${String(
                event,
              )} unable to transition to a new target variant`,
            );
          }

          if (
            newVariant !== 'unknown' &&
            config.manifest.variants[newVariant].safeParse(newData).success !==
              false
          ) {
            return {
              variantData: newData as ReturnType<
                (typeof config)['manifest']['variants'][(typeof config)['variantMap'][typeof variant][typeof event]['onResult'][number]['target']]['parse']
              >,
              // variantName:
              //   newVariant as (typeof config)['variantMap'][typeof variant][typeof event]['onResult'][number]['target'],
              variantName: newVariant as any,
              send,
            };
          } else {
            return {
              variantData: new DomainInvariantViolationError(
                `Resulting data invalid for new variant: ${String(newVariant)}`,
              ),
              variantName: 'unknown',
            };
          }
        } catch (error) {
          if (isError(error)) {
            return {
              variantData: new UnexpectedError(error.message),
              variantName: 'unknown',
            };
          } else {
            return {
              variantData: new UnexpectedError(String(error)),
              variantName: 'unknown',
            };
          }
        }
      };

      return {
        variantName: variant,
        variantData: data,
        send: send as any,
      };
    },
  };
};
