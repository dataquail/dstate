export const main = (arg: boolean) => arg;

export const createAggregate = () => {
  let aggregateData = {
    count: 0,
  };
  type State = 'zero' | 'positive' | 'negative' | 'unknown';
  type Event = 'ADD_ONE' | 'MINUS_ONE';
  let currentState: State = 'zero';

  const addOne = () => {
    aggregateData = {
      count: aggregateData.count + 1,
    };
  };

  const minusOne = () => {
    aggregateData = {
      count: aggregateData.count - 1,
    };
  };

  const stateChart = {
    states: {
      zero: {
        on: {
          ADD_ONE: {
            invoke: addOne,
            success: {
              target: 'positive' as const,
            },
            error: {
              target: 'unknown' as const,
            },
          },
          MINUS_ONE: {
            invoke: minusOne,
            success: {
              target: 'negative' as const,
            },
            error: {
              target: 'unknown' as const,
            },
          },
        },
      },
      positive: {
        on: {
          MINUS_ONE: {
            invoke: minusOne,
            success: {
              target: 'zero' as const,
            },
            error: {
              target: 'unknown' as const,
            },
          },
        },
      },
      negative: {
        on: {
          ADD_ONE: {
            invoke: addOne,
            success: {
              target: 'zero' as const,
            },
            error: {
              target: 'unknown' as const,
            },
          },
        },
      },
      unknown: {},
    },
  };

  return {
    getCurrentState: () => currentState,
    getAggregateData: () => aggregateData,
    send: (event: Event) => {
      switch (currentState) {
        case 'zero':
          if (event === 'ADD_ONE') {
            try {
              stateChart.states[currentState].on[event].invoke();
              currentState =
                stateChart.states[currentState].on[event].success.target;
            } catch (error) {
              currentState =
                stateChart.states[currentState as 'zero'].on[event].error
                  .target;
            }
          } else if (event === 'MINUS_ONE') {
            try {
              stateChart.states[currentState].on[event].invoke();
              currentState =
                stateChart.states[currentState].on[event].success.target;
            } catch (error) {
              currentState =
                stateChart.states[currentState as 'zero'].on[event].error
                  .target;
            }
          }
          break;
        case 'positive':
          if (event === 'MINUS_ONE') {
            try {
              stateChart.states[currentState].on[event].invoke();
              currentState =
                stateChart.states[currentState].on[event].success.target;
            } catch (error) {
              currentState =
                stateChart.states[currentState as 'zero'].on[event].error
                  .target;
            }
          }
          break;
        case 'negative':
          if (event === 'ADD_ONE') {
            try {
              stateChart.states[currentState].on[event].invoke();
              currentState =
                stateChart.states[currentState].on[event].success.target;
            } catch (error) {
              currentState =
                stateChart.states[currentState as 'zero'].on[event].error
                  .target;
            }
          }
          break;
        case 'unknown':
        default:
          break;
      }
    },
  };
};
