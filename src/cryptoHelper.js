const getSharedKey = async (senderId, receiverId) => {
  const secretString = [senderId, receiverId].sort().join("_secret_salt_key");
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secretString),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("FiveStarHotel_Salt_E2EE"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptMessage = async (plainText, senderId, receiverId) => {
  const enc = new TextEncoder();
  const sharedKey = await getSharedKey(senderId, receiverId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    sharedKey,
    enc.encode(plainText)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    ivString: btoa(String.fromCharCode(...iv)),
  };
};

export const decryptMessage = async (ciphertext, ivString, senderId, receiverId) => {
  try {
    const sharedKey = await getSharedKey(senderId, receiverId);
    const iv = new Uint8Array(atob(ivString).split("").map((c) => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(ciphertext).split("").map((c) => c.charCodeAt(0)));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      encryptedData
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    return "[Unable to read message]";
  }
};
