export enum TopoBackendErrno {
  OK,
  GenericError,
}


export interface TopoAppGenericData<T> {
  code: number;
  data: T;
}

export class TopoAppBackendError extends Error {
  constructor(public code: number, public message: string, public params?: any) {
    super(message);
  }
}
