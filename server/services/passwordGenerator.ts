import bcrypt from 'bcryptjs';

export function isTrivial4Digit(str: string): boolean {
  if (str.length !== 4) return true;
  // All same: 1111, 2222, etc.
  if (/^(\d)\1{3}$/.test(str)) return true;

  // Sequential ascending: 1234, 2345, 6789
  let asc = true;
  for (let i = 1; i < 4; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) + 1) {
      asc = false;
      break;
    }
  }
  if (asc) return true;

  // Sequential descending: 4321, 9876
  let desc = true;
  for (let i = 1; i < 4; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) - 1) {
      desc = false;
      break;
    }
  }
  if (desc) return true;

  // Repeating pairs: 1212, 5050
  if (str.slice(0, 2) === str.slice(2, 4)) return true;

  // 0000 or trailing 000: 1000, 2000
  if (/^[1-9]000$/.test(str)) return true;

  return false;
}

export function generateRandom4Digits(): string {
  while (true) {
    const d1 = Math.floor(Math.random() * 9) + 1; // 1-9
    const d2 = Math.floor(Math.random() * 10);
    const d3 = Math.floor(Math.random() * 10);
    const d4 = Math.floor(Math.random() * 10);
    const candidate = `${d1}${d2}${d3}${d4}`;

    if (!isTrivial4Digit(candidate)) {
      return candidate;
    }
  }
}

/**
 * Sanitizes last name for clean password creation:
 * - Capitalizes first letter
 * - Removes non-alphanumeric chars
 */
export function sanitizeLastName(lastName: string): string {
  const cleaned = lastName.trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!cleaned) return 'Student';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/**
 * Generates initial student password: LastName + Random 4 digits
 * e.g. Najimov5837
 */
export function generateStudentPassword(lastName: string): { plainText: string; hash: string } {
  const prefix = sanitizeLastName(lastName);
  const digits = generateRandom4Digits();
  const plainText = `${prefix}${digits}`;
  const hash = bcrypt.hashSync(plainText, 10);

  return {
    plainText,
    hash,
  };
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function verifyPassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}
