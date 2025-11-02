export type Result<T, E> = Ok<T> | Err<E>;

export type Ok<T> = {
  readonly type: "ok";
  value: T;
};

export type Err<E> = {
  readonly type: "err";
  error: E;
};

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.type === "ok";
}

export function ok<T>(value: T): Ok<T> {
  return {
    type: "ok",
    value,
  };
}

export function err<E>(error: E): Err<E> {
  return {
    type: "err",
    error,
  };
}
