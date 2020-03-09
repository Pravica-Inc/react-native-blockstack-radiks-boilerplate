export interface ICancellablePromise<T> {
  then: (cb: (data: T) => any) => ICancellablePromise<T>;
  catch: (cb: (error: Error) => any) => ICancellablePromise<T>;
  abort: () => ICancellablePromise<T>;
}

export function createCancellablePromise<T>(
  promise: Promise<T>,
): ICancellablePromise<T> {
  type thenListener = (data: T) => any;
  type catchListener = (e: Error) => any;
  type finallyListener = () => any;
  let thenListeners: thenListener[] = [];
  let finallyListeners: finallyListener[] = [];
  let catchListeners: catchListener[] = [];

  promise.then(data => thenListeners.forEach(cb => cb(data)));

  promise.catch(e => catchListeners.forEach(cb => cb(e)));
  promise.finally(() => finallyListeners.forEach(cb => cb()));
  const abort = () => {
    thenListeners = [];
    catchListeners = [];
    finallyListeners = [];
    return cancellablePromise;
  };

  const cancellablePromise = {
    then: (cb: thenListener) => {
      thenListeners.push(cb);
      return cancellablePromise;
    },
    catch: (cb: catchListener) => {
      catchListeners.push(cb);
      return cancellablePromise;
    },
    finally: (cb: finallyListener) => {
      finallyListeners.push(cb);
      return cancellablePromise;
    },
    abort,
  };

  return cancellablePromise;
}
