// 文字列の最初の文字だけ大文字にする
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 指定文字数を超えたら「...」で切る
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

// 数値が範囲内かチェックする
function isInRange(num, min, max) {
  return num >= min && num <= max;
}

module.exports = { capitalize, truncate, isInRange };
