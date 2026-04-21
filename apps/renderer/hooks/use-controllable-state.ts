"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SetStateAction<T> = T | ((prevState: T) => T);

type UseControllableStateParams<T> = {
  prop?: T;
  defaultProp?: T;
  onChange?: (state: T) => void;
};

function resolveState<T>(nextValue: SetStateAction<T>, currentValue: T) {
  return typeof nextValue === "function"
    ? (nextValue as (prevState: T) => T)(currentValue)
    : nextValue;
}

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>) {
  const [uncontrolledState, setUncontrolledState] = useState<T | undefined>(
    defaultProp,
  );
  const isControlled = prop !== undefined;
  const value = (isControlled ? prop : uncontrolledState) as T;
  const propRef = useRef(prop);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    propRef.current = prop;
  }, [prop]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue = useCallback((nextValue: SetStateAction<T>) => {
    if (isControlled) {
      const currentValue = propRef.current as T;
      const resolvedValue = resolveState(nextValue, currentValue);

      if (!Object.is(resolvedValue, currentValue)) {
        onChangeRef.current?.(resolvedValue);
      }
      return;
    }

    setUncontrolledState((prevState) => {
      const currentValue = prevState as T;
      const resolvedValue = resolveState(nextValue, currentValue);

      if (!Object.is(resolvedValue, currentValue)) {
        onChangeRef.current?.(resolvedValue);
        return resolvedValue;
      }

      return prevState;
    });
  }, [isControlled]);

  return [value, setValue] as const;
}
