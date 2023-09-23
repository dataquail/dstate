import { ZodObject, ZodRawShape } from 'zod';

type Config<
  TStateName extends string,
  TEventName extends string,
  TZodObject extends ZodRawShape,
> = {
  manifest: Manifest<TStateName, TEventName, TZodObject>;
  stateMap: {
    [key in TStateName]: {
      [key in TEventName]: {
        invoke: (data: any) => any;
        onResult: {
          cond?: (data: any, error: Error) => boolean;
          target: TStateName;
        }[];
      };
    };
  };
};

type Manifest<
  TStateName extends string,
  TEventName extends string,
  TZodObject extends ZodRawShape,
> = {
  states: {
    [key in TStateName]: ZodObject<TZodObject>;
  };
  events: {
    [key in TEventName]: any;
  };
};

export const createModel = <
  TStateName extends string,
  TEventName extends string,
  TZodObject extends ZodRawShape,
  TConfig extends Config<TStateName, TEventName, TZodObject>,
>(
  config: TConfig,
) => {
  // type States = keyof TConfig['manifest']['states'] | 'unknown';
  // type Events = keyof TConfig['manifest']['events'];

  return {
    asState: <TState extends TStateName>(
      state: TState,
      data: TConfig['manifest']['states'][TStateName],
    ) => {
      let currentState = state;
      let currentData = data;

      if (!config.manifest.states[state as unknown as TStateName]) {
        // State not recognized
        currentState = 'unknown' as any;
      } else if (
        config.manifest.states[state as unknown as TStateName].safeParse(data)
          .success === false
      ) {
        // Invalid data for provided state
        currentState = 'unknown' as any;
      }

      const model = {
        // TODO: clone currentData
        getData: () => currentData,
        // TODO: clone currentState
        getState: () => currentState,
        send: (event: keyof TConfig['stateMap'][typeof currentState]) => {
          if (!config.stateMap[currentState]) {
            return model;
          }

          const eventMap =
            config.stateMap[currentState as unknown as TStateName][
              event as unknown as TEventName
            ];
          if (!eventMap) {
            // Event not recognized
            currentState = 'unknown' as any;
            return model;
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
