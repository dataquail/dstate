export type Transition = {
  invoke: (...args: any[]) => any;
};

export const createTransition = <TInvoke extends (...args: any[]) => any>(
  invoke: TInvoke,
) => {
  return {
    invoke,
  };
};
