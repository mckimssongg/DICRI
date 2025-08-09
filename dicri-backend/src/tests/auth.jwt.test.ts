import { signAccess, verifyAccess } from '../utils/jwt';

describe('jwt utils', () => {
  it('sign/verify access', () => {
    const t = signAccess({ sub: 1, username:'admin', roles:['admin'] });
    const p = verifyAccess<{ sub:number }>(t);
    expect(p.sub).toBe(1);
  });
});
