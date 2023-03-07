import { ApiStacktrace } from '../api-types';
import { parseStacktrace } from '../utils';
import { describe, it, expect } from 'vitest';

describe('Utilities', () => {
  describe('parseStacktrace', () => {
    it('should parse node stacktraces', () => {
      const line = 'notify@http://localhost:3000/demo/index.ts:27:20';
      const expected: ApiStacktrace = {
        columnNumber: 20,
        lineNumber: 27,
        file: 'http://localhost:3000/demo/index.ts',
        method: 'notify',
      };

      expect(parseStacktrace(line)).toEqual(expected);
    });

    it('should parse anonymous node stacktraces', () => {
      const line = '@http://localhost:3000/demo/index.ts:27:20';
      const expected: ApiStacktrace = {
        columnNumber: 20,
        lineNumber: 27,
        file: 'http://localhost:3000/demo/index.ts',
        method: 'anonymous',
      };

      expect(parseStacktrace(line)).toEqual(expected);
    });

    it('should parse browser stacktrace', () => {
      const line = '    at Tg.notify (chrome-extension://some-extension-id/background.js:26:1464)';
      const expected: ApiStacktrace = {
        columnNumber: 1464,
        lineNumber: 26,
        file: 'chrome-extension://some-extension-id/background.js',
        method: 'Tg.notify',
      };

      expect(parseStacktrace(line)).toEqual(expected);
    });

    it('should parse anonymous browser stacktrace', () => {
      const line = '    at chrome-extension://some-extension-id/background.js:26:1464';
      const expected: ApiStacktrace = {
        columnNumber: 1464,
        lineNumber: 26,
        file: 'chrome-extension://some-extension-id/background.js',
        method: 'anonymous',
      };

      expect(parseStacktrace(line)).toEqual(expected);
    });
  });
});
