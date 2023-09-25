import { ZodObject, ZodRawShape } from 'zod';

import {
  DomainInvariantViolationError,
  UnexpectedError,
  isDomainInvariantViolation,
  isError,
  isUnexpectedError,
} from 'src/errors';

export const createModel = <
  TVariantSchema extends ZodRawShape,
  TConfig extends {
    manifest: {
      variants: {
        [k in keyof TConfig['manifest']['variants']]: ZodObject<TVariantSchema>;
      };
      events: {
        [k in keyof TConfig['manifest']['events']]: any;
      };
    };
    variantMap: {
      [variant in keyof TConfig['manifest']['variants']]: {
        [e in keyof TConfig['manifest']['events']]?: {
          invoke: (
            currentData: ReturnType<
              TConfig['manifest']['variants'][variant]['parse']
            >,
          ) => any;
          onResult: {
            cond?: (data: any, error: Error) => boolean;
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
      targetVariant: TVariantNames,
      data: TInputData,
    ) => {
      let currentVariant: TVariantNames | 'unknown' = targetVariant;
      let currentData:
        | TInputData
        | UnexpectedError
        | DomainInvariantViolationError = data;

      if (!config.manifest.variants[targetVariant]) {
        throw new Error(
          `Unable to instantiate unrecognized variant: ${String(
            targetVariant,
          )}`,
        );
      } else if (
        config.manifest.variants[currentVariant].safeParse(data).success ===
        false
      ) {
        throw new Error('Invalid data for provided variant');
      }

      const model = {
        // TODO: clone currentData
        getVariantData: () => currentData,
        // TODO: clone currentVariant
        getVariantName: () => currentVariant,
        send: <TEvent extends keyof TConfig['variantMap'][TVariantNames]>(
          event: TEvent,
        ) => {
          if (
            currentVariant === 'unknown' ||
            isUnexpectedError(currentData) ||
            isDomainInvariantViolation(currentData)
          ) {
            throw new Error('Cannot send events to unknown variant');
          }

          const currentVariantMap = config.variantMap[
            currentVariant
          ] as TConfig['variantMap'][TVariantNames];

          const eventMap = currentVariantMap[event];
          if (!eventMap) {
            throw new Error(
              `Unrecognized event: ${String(event)} for variant: ${String(
                currentVariant,
              )}`,
            );
          }

          // let newData: ReturnType<
          //   TConfig['variantMap'][TVariantName][TEvent]['invoke']
          // >;
          let newData: any;
          let newError: any;
          try {
            newData = eventMap.invoke(currentData);
          } catch (error) {
            if (isError(error)) {
              currentData = new UnexpectedError(error.message);
            } else {
              currentData = new UnexpectedError(String(error));
            }
            currentVariant = 'unknown';
            return model;
          }

          const newTargetVariant = eventMap.onResult.find((result) => {
            if (result.cond) {
              return result.cond(newData, newError);
            }
            return true;
          })?.target;

          if (!newTargetVariant) {
            // No target variant found - noop
            return model;
          }

          if (
            newTargetVariant !== 'unknown' &&
            config.manifest.variants[newTargetVariant].safeParse(newData)
              .success !== false
          ) {
            currentVariant = newTargetVariant as TVariantNames | 'unknown';
            currentData = newData;
          } else {
            // Resultant data is invalid for new state
            currentData = new DomainInvariantViolationError(
              `Resulting data invalid for new variant: ${String(
                newTargetVariant,
              )}`,
            );
            currentVariant = 'unknown';
            return model;
          }

          return model;
        },
      };
      return model;
    },
  };
};
