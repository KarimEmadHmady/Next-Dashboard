import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Password complexity: 8+ chars, at least 1 uppercase, 1 lowercase, 1 digit
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};
