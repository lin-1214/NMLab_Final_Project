import crypto from "crypto";
const privateKey =
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAylEZSAe8sZMFmRXY/2xS/ITaFby0WcFsT0dUjCHttd/TOjLx\nSvnDvN6arkzpAgXYOK0wRGk2IBVBTjNnwmF5UBI1Vh8RRboGsh2+hUdKgSJbZF68\nRVhzdRIpXhAov3ydGSQUQeTCL3LTtlHXEfceSI3avkcUxtKgzEc6vOhhvtPIKt3D\nEpIrtElhz4irXS4Kjzzn+mXAuxYyaw99B44hW9zKzlq+cI/6pD8OY/sODp9IagvF\n8xpGQ3+I8NVwOyN2CZPrbKgXFk1dZ8dSmf4ARdW2KDjlbDD2rrtp+/LZkANhvtSY\nMabjo5eG0m6m0JBULUKv4v06IxZCNzndmpaUpwIDAQABAoIBADJ9KKT8IU/jU9tP\nQ3cCrncMJGyWSh+4EHJ8Z5INCYiA0fLNMcA3MmzY1Js44FE76ijCt6/q3bIF++Ur\nGPK+Zorf8GWMnT/cW71phNk34FT3oP0cUzmvCCkoHiC2QaT/0SisA04qa3dx3Xm7\nVMPL+se6duNTU9EGUVCJWhQ4neQD/mjUaYCTkuFmrb6DtXOkBOaR7NV0yFeDk2Xe\n0n/5aL9FI7OIE9S4w1eDlylHIC1WbLirGKzhlzB9gSWZw9Aw3TNLrpM3qAhFsCe2\nKQ0npwqHz+k2qvvUGIrMka8CzCe2FpExPGywp8GzRDnn6j5ys2pN+7AKmeS3y0IA\nWPmdKHkCgYEA3dzuLk/cUe26v7U9U4GmXadC/LBipIt5x4kEJPSJmcKxmwVbSKr8\nw2W0kWsVvs1HHz0p84oa0LMe8AnnHEhgIWp/0/Y84ShyoN1l34sLXlZ64JqFfkvp\ncxIZyNrqNunmOf93xZW0muOjG5gRAVTs0+5g7xyJU3Z3DnYsC7NJU5sCgYEA6XJA\nwDZx/TK1ZxbH8HNGjTtEW2dJ6RND5yCOyieGL3aD8B12nlC/5z0uJG1M6GDgCoKd\nZgf6bwEU5AyPu23UYsjbflVvVs0I+8lwwvHipehsR7FROdnHQAJrTpVPZgyeoU1R\n7zUzaHjoIfR5aXb9naAsPo9ZxxkJlA2CCqkskeUCgYBoytCpiUkMXZhmsolr5wIY\nnEdUqU9+Xu6/Y6VUezh/KunOygHq2fCXrnNSeF0GCVm9lJs7EBFIYEKNqG/D+R+G\nyRHloRnyU7OI7eoPY1KUVY6mhfXlyJ9UnckWCOi11VbMMDF3XxW2Ty0cfIATu/Q8\nygx5BGaMyJjFeOWnBSDuXwKBgE8SCeiRCG8Qm+z9BF/nS8BOkMq844X0po1Es9i5\nJnQxGmNcN29MPpPeXyCrfN9A4OHud821ahfrL95GevCrNML48Y+K9Jlb/Wz7QBxn\nvbMgVHy8DJ0hrKF7sEj/vdL890X/YH87b9w1B7toiS81xJV9ST8vYuNTEbF6Gc/u\nmVAZAoGAI0o0s9Q0JkkVR+nP4y6ZUSZ7nQzQKeTP/MvPR7/hi5adnxOZZFjZsIeu\nfgPLQm1bNQqOR3unnHAn0aOm9JOHXXG6RtQ0xvRkLmC7nGJSl7ogYuGT9gFQhkg5\nFVEGI1bzboPENXbovPXGyB0Ctj9zYYk9NmqDyeCnJljqAb7DMwY=\n-----END RSA PRIVATE KEY-----";
const publicKey =
    "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAylEZSAe8sZMFmRXY/2xS\n/ITaFby0WcFsT0dUjCHttd/TOjLxSvnDvN6arkzpAgXYOK0wRGk2IBVBTjNnwmF5\nUBI1Vh8RRboGsh2+hUdKgSJbZF68RVhzdRIpXhAov3ydGSQUQeTCL3LTtlHXEfce\nSI3avkcUxtKgzEc6vOhhvtPIKt3DEpIrtElhz4irXS4Kjzzn+mXAuxYyaw99B44h\nW9zKzlq+cI/6pD8OY/sODp9IagvF8xpGQ3+I8NVwOyN2CZPrbKgXFk1dZ8dSmf4A\nRdW2KDjlbDD2rrtp+/LZkANhvtSYMabjo5eG0m6m0JBULUKv4v06IxZCNzndmpaU\npwIDAQAB\n-----END PUBLIC KEY-----";
const challenge = "hello world";
const challengeHash = crypto.createHash("sha256").update(challenge).digest();

const verifySignature = async ({ signature, publicKey, challenge }) => {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(challenge);
    verifier.end();
    const publicKeyBuf = Buffer.from(publicKey, "base64").toString("ascii");
    const signatureBuf = Buffer.from(signature, "base64");
    const verified = verifier.verify(publicKey, signatureBuf);
    if (!verified) throw "Signature error";
    return;
};

const sign = async ({ challenge, privateKey }) => {
    console.log("Challenge hash:", challengeHash.toString("hex"));
    const signer = crypto.createSign("SHA256");
    signer.update(challenge);
    signer.end();
    const signature = signer.sign(privateKey).toString("base64");
    return signature;
};

const main = async ({ challenge, privateKey, publicKey }) => {
    const signature = await sign({ challenge, privateKey });
    console.log("Signature:", signature);
    await verifySignature({ signature, publicKey, challenge });
    console.log("Signature verified");
};

console.log("Challenge:", challenge);
console.log("Private key:", privateKey);
console.log("Public key:", publicKey);
main({ challenge, privateKey, publicKey });
