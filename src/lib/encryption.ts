// src/lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = 'aes-256-gcm';
// This reads the key you just generated in the terminal
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

if (SECRET_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 bytes.");
}

export const encrypt = (text: string) => {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string) => {
    try {
        const [iv, authTag, encryptedText] = text.split(':');
        if (!iv || !authTag || !encryptedText) return "Message Corrupted";

        const decipher = createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        return "Message Encrypted (Cannot Decrypt)";
    }
};