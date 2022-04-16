import { Readable } from "node:stream";

export type Body = Readable | Blob | BufferSource | FormData | URLSearchParams | string;
