// Configura secretos ANTES de cargar el módulo a probar
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.JWT_ACCESS_EXPIRES = '1h';
process.env.JWT_REFRESH_EXPIRES = '7d';

describe('utils/jwt', () => {
  it('firma y verifica un token de acceso', () => {
    // Cargamos el módulo tras definir las env vars
    const { signAccess, verifyAccess } = require('../src/utils/jwt');
    const payload = { sub: 'user-1', role: 'admin' };
    const token = signAccess(payload);
  const decoded = verifyAccess(token) as any;
    expect(decoded.sub).toBe('user-1');
    expect(decoded.role).toBe('admin');
  });

  it('firma y verifica un token de refresh', () => {
    const { signRefresh, verifyRefresh } = require('../src/utils/jwt');
    const payload = { sub: 'user-2' };
    const token = signRefresh(payload);
  const decoded = verifyRefresh(token) as any;
    expect(decoded.sub).toBe('user-2');
  });

  it('falla al verificar token de acceso con el secreto de refresh', () => {
    const { signAccess, verifyRefresh } = require('../src/utils/jwt');
    const token = signAccess({ sub: 'x' });
    expect(() => verifyRefresh(token)).toThrow();
  });
});
