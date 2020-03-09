import { useState } from 'react';

export const useProgressState = () => {
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);
  const [loading, setLoading] = useState(false);

  return {
    setDefault: () => {
      setSuccess(false);
      setFailure(false);
      setLoading(false);
    },
    setSuccess: () => {
      setSuccess(true);
      setFailure(false);
      setLoading(false);
    },
    setFailure: () => {
      setFailure(true);
      setSuccess(false);
      setLoading(false);
    },
    setLoading: () => {
      setFailure(false);
      setSuccess(false);
      setLoading(true);
    },
    success,
    failure,
    loading,
  };
};
