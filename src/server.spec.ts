import { expect } from 'chai';
import request from 'supertest';
import { mockApp, mockedDebuglog } from '../test/mocks';
import { capture } from 'ts-mockito';

describe('Server', () => {
  it('logs in green when a request succeeds', async () => {
    await request(mockApp)
      .get('/v1/ping')
      .expect(200);
    expect(capture(mockedDebuglog.log).first()).to.deep.equal([ '\u001b[32m%s\u001b[0m', 'GET /v1/ping 200' ]);
  });

  it('logs in red when a request fails', async () => {
    await request(mockApp)
      .get('/DOES-NOT-EXIST')
      .expect(404);
    expect(capture(mockedDebuglog.log).first()).to.deep.equal([ '\u001b[31m%s\u001b[0m', 'GET /DOES-NOT-EXIST 404' ]);
  });
});
