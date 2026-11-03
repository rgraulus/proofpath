/**
 * ProofPath PP-01 canonical JSON profile v1.
 *
 * Deterministic UTF-8 encoding for controlled JSON values.
 * Not an implementation of RFC 8785 / JCS.
 *
 * Numbers are restricted to safe integers.
 * Strings are not Unicode-normalized.
 * Object keys are sorted by UTF-16 code-unit order.
 */

function assertUnicode(value: string): void {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError("Unpaired high surrogate");
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError("Unpaired low surrogate");
    }
  }
}

export function canonicalJson(value: unknown): string {
  const active = new Set<object>();

  function encode(input: unknown): string {
    if (input === null) return "null";

    if (typeof input === "string") {
      assertUnicode(input);
      return JSON.stringify(input);
    }

    if (typeof input === "boolean") {
      return input ? "true" : "false";
    }

    if (typeof input === "number") {
      if (!Number.isSafeInteger(input)) {
        throw new TypeError("Only safe integer numbers are supported");
      }
      return JSON.stringify(input);
    }

    if (typeof input !== "object") {
      throw new TypeError("Unsupported JSON value");
    }

    const prototype = Object.getPrototypeOf(input);

    if (Array.isArray(input)) {
      if (active.has(input)) {
        throw new TypeError("Cyclic JSON structure");
      }

      if (Object.getOwnPropertySymbols(input).length !== 0) {
        throw new TypeError("Symbol properties are not supported");
      }

      if (Object.keys(input).length !== input.length) {
        throw new TypeError("Sparse or extended array");
      }

      active.add(input);

      try {
        const parts: string[] = [];

        for (let i = 0; i < input.length; i++) {
          if (!Object.prototype.hasOwnProperty.call(input, i)) {
            throw new TypeError("Sparse array");
          }

          const descriptor = Object.getOwnPropertyDescriptor(input, String(i));
          if (!descriptor || !("value" in descriptor)) {
            throw new TypeError("Array accessors are not supported");
          }

          parts.push(encode(descriptor.value));
        }

        return "[" + parts.join(",") + "]";
      } finally {
        active.delete(input);
      }
    }

    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Only plain JSON objects are supported");
    }

    if (active.has(input)) {
      throw new TypeError("Cyclic JSON structure");
    }

    if (Object.getOwnPropertySymbols(input).length !== 0) {
      throw new TypeError("Symbol properties are not supported");
    }

    active.add(input);

    try {
      const parts: string[] = [];

      for (const key of Object.keys(input).sort()) {
        assertUnicode(key);

        const descriptor = Object.getOwnPropertyDescriptor(input, key);

        if (!descriptor || !("value" in descriptor)) {
          throw new TypeError("Object accessors are not supported");
        }

        parts.push(
          JSON.stringify(key) + ":" + encode(descriptor.value)
        );
      }

      return "{" + parts.join(",") + "}";
    } finally {
      active.delete(input);
    }
  }

  return encode(value);
}

export function canonicalJsonBytes(value: unknown): Buffer {
  return Buffer.from(canonicalJson(value), "utf8");
}
