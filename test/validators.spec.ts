import validators from '@/validators';

describe('Test validators', () => {
  test('should pass', () => {
    const body = {
      type: 'connect',
      content: null,
      clientId: '',
      sessionId: '',
    };
    expect(validators.message(body)).toBeTruthy();
  });
});
