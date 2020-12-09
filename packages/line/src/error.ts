/* eslint-disable import/prefer-default-export */
import { STATUS_CODES } from 'http';
import { LineAPIResult } from './types';

export class LineAPIError extends Error {
  info: any;
  code: number;
  status: string;

  constructor({ code, body }: LineAPIResult) {
    const {
      message,
      details,
      error,
      error_description: errorDescription,
    } = body;

    super(
      message
        ? message +
            (details
              ? `: ${details
                  .map((d, i) => `${i + 1}) ${d.message}, at ${d.property}.`)
                  .join(' ')}`
              : '')
        : error
        ? `${error}: ${errorDescription}`
        : JSON.stringify(body)
    );

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineAPIError);
    }

    this.code = code;
    this.status = STATUS_CODES[code] as string;
    this.name = `LineAPIError (${this.status})`;
    this.info = body;
  }
}
