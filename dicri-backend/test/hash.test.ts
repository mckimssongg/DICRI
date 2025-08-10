import { sha256 } from '../src/utils/hash';

describe('utils/hash.sha256', () => {
  it('calcula el hash sha256 correcto para un buffer', () => {
    const buf = Buffer.from('hola mundo');
    const hex = sha256(buf);
  expect(hex).toHaveLength(64);
  expect(hex).toBe('0b894166d3336435c800bea36ff21b29eaa801a52f584c006c49289a0dcf6e2f');
  });

  it('produce valores diferentes para entradas diferentes', () => {
    const a = sha256(Buffer.from('a'));
    const b = sha256(Buffer.from('b'));
    expect(a).not.toBe(b);
  });
});
