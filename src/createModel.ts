import { ZodObject, ZodRawShape } from 'zod';

export const createModel = <
  TStateSchema extends ZodRawShape,
  TConfig extends {
    manifest: {
      states: {
        [k in keyof TConfig['manifest']['states']]: ZodObject<TStateSchema>;
      };
      events: {
        [k in keyof TConfig['manifest']['events']]: any;
      };
    };
    stateMap: {
      [k in keyof TConfig['manifest']['states']]: {
        [k in keyof TConfig['manifest']['events']]?: {
          invoke: (data: any) => any;
          onResult: {
            cond?: (data: any, error: Error) => boolean;
            target: keyof TConfig['manifest']['states'] | 'unknown';
          }[];
        };
      };
    };
  },
>(
  config: TConfig,
) => {
  type States = keyof TConfig['manifest']['states'];

  return {
    asState: <TStateName extends States>(
      targetState: TStateName,
      data: ReturnType<TConfig['manifest']['states'][TStateName]['parse']>,
    ) => {
      let currentState = targetState;
      let currentData = data;

      if (!config.manifest.states[targetState]) {
        throw new Error(
          `Unable to instantiate unrecognized state: ${String(targetState)}`,
        );
      } else if (
        config.manifest.states[currentState].safeParse(data).success === false
      ) {
        throw new Error('Invalid data for provided state');
      }

      const model = {
        // TODO: clone currentData
        getData: () => currentData,
        // TODO: clone currentState
        getState: () => currentState,
        send: (event: keyof TConfig['stateMap'][typeof currentState]) => {
          const currentStateMap = config.stateMap[
            currentState
          ] as TConfig['stateMap'][TStateName];
          const eventMap = currentStateMap[event];
          if (!eventMap) {
            // Event not recognized
            throw new Error(
              `Unrecognized event: ${String(event)} for state: ${String(
                currentState,
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

          const newState = eventMap.onResult.find((result) => {
            if (result.cond) {
              return result.cond(newData, newError);
            }
            return true;
          })?.target;

          if (
            newState &&
            newState !== 'unknown' &&
            config.manifest.states[newState].safeParse(newData).success !==
              false
          ) {
            currentState = newState as any;
          } else {
            // Resultant data is invalid for new state
            currentState = 'unknown' as any;
          }
          currentData = newData;

          return model;
        },
      };
      return model;
    },
  };
};
