import jsonwebtoken from "jsonwebtoken";

/**
 * Generates a JWT for GitHub App authentication
 */
export function generateJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iat: now,
    exp: now + 10 * 60,
    iss: appId,
  };

  // Handle different private key formats from environment variables
  let formattedKey = privateKey;
  
  // Handle escaped backslashes (common in App Runner/ECS)
  if (privateKey.includes('\\')) {
    formattedKey = privateKey.replace(/\\/g, '\n');
  }
  // Handle escaped newlines from environment variables
  else if (privateKey.includes('\\n')) {
    formattedKey = privateKey.replace(/\\n/g, '\n');
  }

  console.log("formattedKey", formattedKey);
  
  // Ensure the key starts with the proper header
  if (!formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    throw new Error('Invalid RSA private key format');
  }
  
  return jsonwebtoken.sign(payload, formattedKey, { algorithm: "RS256" });
}
