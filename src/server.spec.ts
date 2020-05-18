import { expect } from 'chai';
import request from 'supertest';
import { mockApp, mockedDebuglog } from './fixtures/mocks';
import { capture } from 'ts-mockito';

describe('Server', () => {
  it('logs in green when a request succeeds', async () => {
    await request(mockApp)
      .get('/v3/ping')
      .expect(200);
    expect(capture(mockedDebuglog.log).first()).to.deep.equal([ '\u001b[32m%s\u001b[0m', '/v3/ping response validated' ]);
  });

  it('logs in red when a request fails', async () => {
    await request(mockApp)
      .get('/v3/DOES-NOT-EXIST')
      .expect(404);
    expect(capture(mockedDebuglog.log).first()).to.deep.equal([ '\u001b[31m%s\u001b[0m', 'GET /v3/DOES-NOT-EXIST 404' ]);
  });

  it('returns an error if path does not start with /v3', async () => {
    await request(mockApp)
      .get('/DOES-NOT-EXIST')
      .expect(404);
    expect(capture(mockedDebuglog.log).first()).to.deep.equal([ '\u001b[31m%s\u001b[0m', 'GET /DOES-NOT-EXIST 404' ]);
  });
});
