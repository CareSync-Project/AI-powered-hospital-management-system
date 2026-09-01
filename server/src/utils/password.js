import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const comparePassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);
