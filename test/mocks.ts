import { mock, instance, when, resetCalls, spy, reset } from 'ts-mockito';
import { Server } from '../src/server';
import RippleApiService from '../src/api-v1/services/ripple-api';
import { RippleAPI } from 'ripple-lib';

class Debuglog {
  setKey(key: string) {}
  log(...args: string[]) {}
}
const mockedDebuglog = mock(Debuglog);
const debuglogInstance = instance(mockedDebuglog);
const debuglog = function(key: string) {
  debuglogInstance.setKey(key);
  return function(...args: string[]) {
    debuglogInstance.log(...args);
  }
}

const mockedRippleApiService = mock(RippleApiService);
when(mockedRippleApiService.connectHandleFunction()).thenReturn(function(req, res, next) {
  next();
});

const rippleApi = new RippleAPI();

when(mockedRippleApiService.api).thenReturn(rippleApi);

const mockedRippleApiServiceInstance = instance(mockedRippleApiService);

const server = new Server({rippleApiService: mockedRippleApiServiceInstance});
server.setDebuglog(debuglog);
const app = server.app;

afterEach(() => {
  resetCalls(mockedDebuglog);
});

export {
  app as mockApp,
  mockedDebuglog,
  rippleApi
};
