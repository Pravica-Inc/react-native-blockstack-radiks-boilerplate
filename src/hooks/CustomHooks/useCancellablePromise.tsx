import { useEffect } from 'react';
import { ICancellablePromise } from './createCancellablePromise';

export function useCancelledPromise<T>(
  promisingFn: () => ICancellablePromise<T> | void,
  deps?: any[],
) {
  useEffect(() => {
    const promise = promisingFn();
    return () => {
      if (promise && promise.abort) {
        promise.abort();
      }
    };
  }, deps);
}
