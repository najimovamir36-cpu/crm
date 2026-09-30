/**
 * Unique 5-7 digit Student ID Generator with strict pattern rejection
 */
export function isTrivialSequence(str: string): boolean {
  // Check all identical digits (e.g. 11111, 222222)
  if (/^(\d)\1+$/.test(str)) return true;

  // Check ascending sequence (e.g. 12345, 23456, 123456)
  let isAscending = true;
  for (let i = 1; i < str.length; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) + 1) {
      isAscending = false;
      break;
    }
  }
  if (isAscending) return true;

  // Check descending sequence (e.g. 54321, 654321)
  let isDescending = true;
  for (let i = 1; i < str.length; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) - 1) {
      isDescending = false;
      break;
    }
  }
  if (isDescending) return true;

  // Check alternating repeated patterns (e.g. 121212, 101010)
  if (str.length % 2 === 0) {
    const pair = str.slice(0, 2);
    if (pair.repeat(str.length / 2) === str) return true;
  }

  // Check obvious round thousands (e.g. 10000, 200000)
  if (/^[1-9]0{4,}$/.test(str)) return true;

  return false;
}

export function generateCandidateStudentId(): string {
  // Choose length between 5 and 7 (standard 6 digits for optimal usability, occasionally 5 or 7)
  const lengths = [6, 6, 6, 5, 7];
  const length = lengths[Math.floor(Math.random() * lengths.length)];

  // First digit 1-9 to avoid leading zero
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const digits = [firstDigit];

  for (let i = 1; i < length; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  const idStr = digits.join('');
  if (isTrivialSequence(idStr)) {
    return generateCandidateStudentId();
  }
  return idStr;
}

export function generateUniqueStudentId(existingIds: Set<string> | string[]): string {
  const set = existingIds instanceof Set ? existingIds : new Set(existingIds);
  let attempts = 0;
  while (attempts < 1000) {
    const candidate = generateCandidateStudentId();
    if (!set.has(candidate)) {
      return candidate;
    }
    attempts++;
  }
  // Fallback with timestamp-based high entropy
  const timestampPart = Date.now().toString().slice(-6);
  return timestampPart;
}
