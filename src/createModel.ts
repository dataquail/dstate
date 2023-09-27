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
            cond?: (
              data: ReturnType<
                TConfig['manifest']['variants'][variant]['parse']
              >,
            ) => boolean;
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
      TVariant extends keyof TConfig['manifest']['variants'],
      TInputData extends ReturnType<
        TConfig['manifest']['variants'][TVariant]['parse']
      >,
    >(
      variant: TVariant,
      data: TInputData,
    ): {
      variantName: TVariant;
      variantData: ReturnType<
        TConfig['manifest']['variants'][TVariant]['parse']
      >;
      send: <TEvent extends keyof TConfig['variantMap'][TVariant]>(
        event: TEvent,
      ) =>
        | UnexpectedErrorKind
        | DomainInvariantViolationErrorKind
        | {
            variantName: TConfig['variantMap'][TVariant][TEvent]['onResult'][number]['target'];
            variantData: ReturnType<
              TConfig['manifest']['variants'][TConfig['variantMap'][TVariant][TEvent]['onResult'][number]['target']]['parse']
            >;
            send: (
              e: keyof TConfig['variantMap'][TConfig['variantMap'][TVariant][TEvent]['onResult'][number]['target']],
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

      const send = <TEvent extends keyof TConfig['variantMap'][TVariant]>(
        event: TEvent,
      ) => {
        const variantEventConfig =
          config.variantMap[variant][event as TEvents['type']];

        if (!variantEventConfig) {
          throw new Error(
            `Unrecognized event: ${String(event)} for variant: ${String(
              variant,
            )}`,
          );
        }

        try {
          const newData = variantEventConfig.invoke(data);
          const newVariant = variantEventConfig.onResult.find((result) => {
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
            (config.manifest.variants as any)[newVariant].safeParse(newData)
              .success !== false
          ) {
            return {
              variantData: newData as ReturnType<
                TConfig['manifest']['variants'][TConfig['variantMap'][TVariant][TEvent]['onResult'][number]['target']]['parse']
              >,
              variantName:
                newVariant as TConfig['variantMap'][TVariant][TEvent]['onResult'][number]['target'],
              send,
            };
          } else {
            return {
              variantData: new DomainInvariantViolationError(
                `Resulting data invalid for new variant: ${String(newVariant)}`,
              ),
              variantName: 'unknown' as const,
            };
          }
        } catch (error) {
          if (isError(error)) {
            return {
              variantData: new UnexpectedError(error.message),
              variantName: 'unknown' as const,
            };
          } else {
            return {
              variantData: new UnexpectedError(String(error)),
              variantName: 'unknown' as const,
            };
          }
        }
      };

      return {
        variantName: variant,
        variantData: data,
        send,
      };
    },
  };
};
