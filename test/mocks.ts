import { mock, instance, when, resetCalls } from 'ts-mockito';
import { Server } from '../src/server';
import RippleApiService from '../src/api-v1/services/ripple-api';
import { RippleAPI } from 'ripple-lib';

class Debuglog {
  public setKey(_key: string): void {}
  public log(..._args: string[]): void {}
}
const mockedDebuglog = mock(Debuglog);
const debuglogInstance = instance(mockedDebuglog);
const debuglog = function(key: string): (...args: string[]) => void {
  debuglogInstance.setKey(key);
  return function(...args: string[]) {
    debuglogInstance.log(...args);
  };
};

const mockedRippleApiService = mock(RippleApiService);
when(mockedRippleApiService.connectHandleFunction()).thenReturn(function(req, res, next) {
  next();
});

const rippleApi = new RippleAPI();

when(mockedRippleApiService.api).thenReturn(rippleApi);

const mockedRippleApiServiceInstance = instance(mockedRippleApiService);

const server = new Server({rippleApiService: mockedRippleApiServiceInstance, debuglog});
const app = server.expressApp();

afterEach(() => {
  resetCalls(mockedDebuglog);
});

export {
  app as mockApp,
  mockedDebuglog,
  rippleApi,
  Debuglog
};
