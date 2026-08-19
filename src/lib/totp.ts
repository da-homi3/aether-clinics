import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

export async function generateTotpSecret(email: string) {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "Aether Clinics",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret: secret.base32, otpauthUrl, qrDataUrl };
}

export function verifyTotp(secretBase32: string, token: string) {
  const totp = new TOTP({
    issuer: "Aether Clinics",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
