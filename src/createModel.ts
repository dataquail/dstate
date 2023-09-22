// import { z } from 'zod';

// <Value extends number, T extends { a: Value }

export const createModel = (config: {
  manifest: {
    states: { name: string; schema: any }[];
    events: { name: string; schema: any }[];
  };
  stateMap: {
    [state: string]: {
      [event: string]: {
        invoke: (data: any) => any;
        onResult: {
          cond?: (data: any, error: Error) => boolean;
          target: string;
        }[];
      };
    };
  };
}) => {
  const stateValidationMap = config.manifest.states.reduce((acc, state) => {
    acc[state.name] = state.schema;
    return acc;
  }, {} as { [state: string]: any });

  return {
    asState: (state: string, data: any) => {
      let currentState = state;
      let currentData = data;

      if (!stateValidationMap[state]) {
        currentState = 'unknown';
      } else if (stateValidationMap[state].safeParse(data).success === false) {
        currentState = 'unknown';
      }

      const model = {
        getData: () => currentData,
        getState: () => currentState,
        send: (event: string) => {
          if (!config.stateMap[currentState]) {
            return model;
          }

          const eventMap = config.stateMap[currentState][event];
          if (!eventMap) {
            currentState = 'unknown';
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
            stateValidationMap[newState].safeParse(newData).success !== false
          ) {
            currentState = newState;
          } else {
            currentState = 'unknown';
          }
          currentData = newData;

          return model;
        },
      };
      return model;
    },
  };
};
