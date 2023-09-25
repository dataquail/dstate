import { ZodObject, ZodRawShape } from 'zod';

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
      [k in keyof TConfig['manifest']['variants']]: {
        [k in keyof TConfig['manifest']['events']]?: {
          invoke: (data: any) => any;
          onResult: {
            cond?: (data: any, error: Error) => boolean;
            target: keyof TConfig['manifest']['variants'] | 'unknown';
          }[];
        };
      };
    };
  },
>(
  config: TConfig,
) => {
  type Variants = keyof TConfig['manifest']['variants'];

  return {
    asVariant: <TStateName extends Variants>(
      targetVariant: TStateName,
      data: ReturnType<TConfig['manifest']['variants'][TStateName]['parse']>,
    ) => {
      let currentVariant = targetVariant;
      let currentData = data;

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
        send: (event: keyof TConfig['variantMap'][typeof currentVariant]) => {
          const currentVariantMap = config.variantMap[
            currentVariant
          ] as TConfig['variantMap'][TStateName];
          const eventMap = currentVariantMap[event];
          if (!eventMap) {
            // Event not recognized
            throw new Error(
              `Unrecognized event: ${String(event)} for variant: ${String(
                currentVariant,
              )}`,
            );
          }

          let newData: any;
          let newError: any;
          try {
            newData = eventMap.invoke(currentData);
          } catch (error) {
            newError = error;
          }

          const newVariant = eventMap.onResult.find((result) => {
            if (result.cond) {
              return result.cond(newData, newError);
            }
            return true;
          })?.target;

          if (
            newVariant &&
            newVariant !== 'unknown' &&
            config.manifest.variants[newVariant].safeParse(newData).success !==
              false
          ) {
            currentVariant = newVariant as any;
          } else {
            // Resultant data is invalid for new state
            currentVariant = 'unknown' as any;
          }
          currentData = newData;

          return model;
        },
      };
      return model;
    },
  };
};
