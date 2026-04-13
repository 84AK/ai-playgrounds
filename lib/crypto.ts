import crypto from "crypto";

// [보안] 서버사이드에서만 사용하는 암호화 키
// 실제 배포 시에는 Vercel 환경 변수(NEXT_PUBLIC_ 기두가 없는)에 저장해야 함
const ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY || "vibe-coding-ai-study-playgrounds-2026-key"; 
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
    if (!text) return "";
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
    if (!text || !text.includes(":")) return "";
    try {
        const textParts = text.split(":");
        const iv = Buffer.from(textParts.shift()!, "hex");
        const encryptedText = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return "";
    }
}
