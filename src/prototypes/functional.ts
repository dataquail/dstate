// HYBRID
// const counterAggregate = createAggregate();

// counterAggregate.defineStates([
//   { name: 'zero', shape: { count: 'number' } },
//   { name: 'positive', shape: { count: 'number' } },
//   { name: 'negative', shape: { count: 'number' } },
//   { name: 'unknown', shape: { count: 'number' } },
// ]);
//
// counterAggregate
//   .state('zero')
//   .onEvent('ADD_ONE', {
//     invoke: addOne,
//     onSuccess: { nextState: 'positive' },
//     onError: { nextState: 'unknown' },
//   })
//   .onEvent('MINUS_ONE', {
//     invoke: minusOne,
//     onSuccess: { nextState: 'negative' },
//     onError: { nextState: 'unknown' },
//   })
//   .state('positive')
//   .onEvent('MINUS_ONE', {
//     invoke: minusOne,
//     onSuccess: { nextState: 'zero' },
//     onError: { nextState: 'unknown' },
//   })
//   .state('negative')
//   .onEvent('ADD_ONE', {
//     invoke: addOne,
//     onSuccess: { nextState: 'zero' },
//     onError: { nextState: 'unknown' },
//   });

// HYBRID WITH CALLBACKS
// const aggregate = createAggregate([
//   { name: 'zero', shape: { count: 'number' } },
//   { name: 'positive', shape: { count: 'number' } },
//   { name: 'negative', shape: { count: 'number' } },
//   { name: 'unknown', shape: { count: 'number' } },
// ]);
//
// counterAggregate
//   .state('zero', (state) => {
//     state
//       .event('ADD_ONE')
//       .invoke(addOne)
//       .onResult([
//         [isPositive, state.transitionTo('positive')],
//         [isError, state.transitionTo('unknown')],
//       ]);
//     state
//       .event('MINUS_ONE')
//       .invokes(minusOne)
//       .if(isNegative, 'negative')
//       .if(isError, 'unknown');
//   })
//   .state('positive', (state) => {
//     state
//       .event('MINUS_ONE')
//       .invoke(minusOne)
//       .if(isZero, 'zero')
//       .if(isError, 'unknown');
//   })
//   .state('negative', (state) => {
//     state
//       .event('ADD_ONE')
//       .invoke(addOne)
//       .if(isZero, 'zero')
//       .if(isError, 'unknown');
//   });

// OBJECT STYLE
// const counterAggregate = createAggregate({
//   manifest: {
//     states: [
//       { name: 'zero', schema: { count: 0 } },
//       { name: 'positive', schema: { count: 1 } },
//       { name: 'negative', schema: { count: -1 } },
//       { name: 'unknown', schema: { count: null } },
//     ],
//     events: [
//       { name: 'ADD_ONE', schema: {} },
//       { name: 'MINUS_ONE', schema: {} },
//     ],
//   },
//   stateMap: {
//     zero: {
//       ADD_ONE: {
//         invoke: addOne,
//         onResult: [
//           { cond: isError, target: 'unknown' as const },
//           { target: 'positive' as const },
//         ],
//       },
//       MINUS_ONE: {
//         invoke: minusOne,
//         onResult: [
//           { cond: isError, target: 'unknown' as const },
//           { target: 'negative' as const },
//         ],
//       },
//     },
//     positive: {
//       MINUS_ONE: {
//         invoke: minusOne,
//         onResult: [
//           { cond: isError, target: 'unknown' as const },
//           { target: 'zero' as const },
//         ],
//       },
//     },
//     negative: {
//       ADD_ONE: {
//         invoke: addOne,
//         onResult: [
//           { cond: isError, target: 'unknown' as const },
//           { target: 'zero' as const },
//         ],
//       },
//     },
//   },
// });

// FUNCTIONAL CHAINING
// const aggregate = createAggregate([
//   { name: 'zero', shape: { count: 'number' } },
//   { name: 'positive', shape: { count: 'number' } },
//   { name: 'negative', shape: { count: 'number' } },
//   { name: 'unknown', shape: { count: 'number' } },
// ]);

// aggregate
//   .state('zero')
//   .event('ADD_ONE', addOne)
//   .onResult([
//     { if: [isError, 'unknown' as const] },
//     { else: 'positive' as const },
//   ])
//   .event('MINUS_ONE', minusOne)
//   .onResult([
//     { if: [isError, 'unknown' as const] },
//     { else: 'negative' as const },
//   ]);
// aggregate
//   .state('positive')
//   .event('MINUS_ONE', minusOne)
//   .onResult([{ if: [isError, 'unknown' as const] }, { else: 'zero' as const }]);
// aggregate
//   .state('negative')
//   .event('ADD_ONE', addOne)
//   .onResult([{ if: [isError, 'unknown' as const] }, { else: 'zero' as const }]);
