import { server } from '@/index';
jest.mock('../src/db', () => jest.fn());

describe('Server is defined', () => {
  afterAll(() => {
    server.close();
  });

  test('should pass', () => {
    expect(server).toBeTruthy();
  });
});
