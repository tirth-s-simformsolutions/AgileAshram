import { randomBytes, pbkdf2, timingSafeEqual } from 'crypto';

export const createHash = async (
  value: string,
  iterationRound: number = 100000,
): Promise<string> => {
  // Generate a random salt
  const salt = randomBytes(16).toString('hex');

  // Hash the value with the salt using PBKDF2
  return new Promise((resolve, reject) => {
    pbkdf2(value, salt, iterationRound, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      // Store hash and salt together, separated by a dot
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
};

export const compareHash = async (
  value: string,
  hashedValue: string,
  iterationRound: number = 100000,
): Promise<boolean> => {
  // Split the stored hash into hash and salt
  const [hash, salt] = hashedValue.split('.');

  if (!hash || !salt) {
    return false; // Invalid format
  }

  return new Promise((resolve, reject) => {
    pbkdf2(value, salt, iterationRound, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);

      // Convert both hashes to buffers for timing-safe comparison
      const hashBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey);
      // Ensure both buffers are the same length for timingSafeEqual
      if (hashBuffer.length !== derivedBuffer.length) {
        return resolve(false);
      }
      try {
        // Use timingSafeEqual to prevent timing attacks
        const isMatch = timingSafeEqual(hashBuffer, derivedBuffer);
        resolve(isMatch);
      } catch {
        resolve(false);
      }
    });
  });
};
