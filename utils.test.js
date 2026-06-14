const { capitalize, truncate, isInRange } = require('./utils');

// --- capitalize ---
describe('capitalize', () => {
  test('最初の文字を大文字にする', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('すでに大文字なら変わらない', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  test('1文字だけの文字列', () => {
    expect(capitalize('a')).toBe('A');
  });

  test('空文字列は空文字列を返す', () => {
    expect(capitalize('')).toBe('');
  });

  test('nullは空文字列を返す', () => {
    expect(capitalize(null)).toBe('');
  });

  test('undefinedは空文字列を返す', () => {
    expect(capitalize(undefined)).toBe('');
  });
});

// --- truncate ---
describe('truncate', () => {
  test('maxLength以下なら切らない', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('ちょうどmaxLengthと同じ長さなら切らない', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  test('maxLengthを超えたら「...」をつけて切る', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  test('空文字列はそのまま返す', () => {
    expect(truncate('', 5)).toBe('');
  });
});

// --- isInRange ---
describe('isInRange', () => {
  test('範囲内の値はtrue', () => {
    expect(isInRange(5, 1, 10)).toBe(true);
  });

  test('最小値ちょうどはtrue（境界値）', () => {
    expect(isInRange(1, 1, 10)).toBe(true);
  });

  test('最大値ちょうどはtrue（境界値）', () => {
    expect(isInRange(10, 1, 10)).toBe(true);
  });

  test('範囲より小さい値はfalse', () => {
    expect(isInRange(0, 1, 10)).toBe(false);
  });

  test('範囲より大きい値はfalse', () => {
    expect(isInRange(11, 1, 10)).toBe(false);
  });

  test('マイナスの範囲でも動作する', () => {
    expect(isInRange(-5, -10, 0)).toBe(true);
  });
});
