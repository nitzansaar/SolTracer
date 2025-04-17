declare module 'mocha' {
  export interface Done {
    (error?: any): void;
    fail(error?: any): void;
  }

  export interface TestFunction {
    (this: any): void | Promise<void>;
    (this: any, done: Done): void;
  }

  export interface SuiteFunction {
    (this: any): void;
  }

  export function describe(description: string, spec: SuiteFunction): void;
  export function xdescribe(description: string, spec: SuiteFunction): void;

  export function it(expectation: string, test?: TestFunction): void;
  export function xit(expectation: string, test?: TestFunction): void;

  export function before(setup: TestFunction): void;
  export function beforeEach(setup: TestFunction): void;

  export function after(teardown: TestFunction): void;
  export function afterEach(teardown: TestFunction): void;
}

declare namespace Mocha {
  export interface Done {
    (error?: any): void;
    fail(error?: any): void;
  }
}
