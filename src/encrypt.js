import forge from 'node-forge';

// RSA private key in PEM format
const privateKeyPem = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA3V3Y4NSCc0Pm+PxeRjASuE+MFL9+1E3NzPPyCEMx6PQOKZJ+xdb/nIKfRDrGtg7VEBfOCDqItDcw17Tu2Q42pO7dFQ1vFfmAFm27I1V2wpQWWaM7hc9ttDmzKKY/VyspG66VB8uBmYpoHrbk9ib0MTFndgJKCRLr8FAu9M+BDn/1lysEYqPLva58Tag4PK0bxIbwQNWcXASg7tmOOSJnEgz/hBVXYbGv/kCzHJEpCZcU2GlhJ0xOvrit1no5lXV7zizd0NepgwkiuK2NHHZj4dDUxrNly/PtI0rWMaYgU6gEKysHZtf2J+/FhwA0IHR6oGV1hp8NQ99kIcPNnbJz2wIDAQABAoIBAFZRaOdKlk+B88e1CMHPrw0Fn7bbcQYyDITVvtPv979Bo2Aciqh0jJmn6Zi+XovRPs2WqrVUtceoGbiTCevDehVYOwchhOaJsqOMSEOf6L445novh19HIhz7vtuj7+D6qH3t1pkChterO6x2XtOJHwErpY9Dl0DwiuXbLmQxob5X92jvFzcABYIQpNM9lvmUy33XDnNgDK47I+ZZP6x5s+zThYo5X1tWDFFWQ5LxiY0yo117oMuUZTuk3B+y4VUZYF4pyen7QTegZe6bTFrco0A6mQ6Ztt4iCHxodyhe5JrfdgWnQzNQmR9dzqS8uAMOssf6zD7UDw33aUP9A/8h2WECgYEA8q7BJoeGc0MNiKo6xBYK5PXZIXBQ/m1bggP1gO+3Z8g/PNiXJMe6MJKtzbMoD/Op+QJiM4ykcxPl0HR9DpN9j1pNQRw2+3dGO14HdG1BBaLhgRipp9BDAdMwDnwLRCD1wRPiCPzSRz+2jEc3GCQPisf/+b0REavGu9dxblMOBGsCgYEA6YOkMpqeb/1OkWgowsR0D+7ChXimCPzWW+Zcg2/ukIIeRz7XxPELugymsRuVJoWcUjNNVCPI6wYc/MW5ZggaJi2/p7os/AjCiZloJd2wtC2gPriUMNi7CnF2t0/s+YgtCfgq5wHZ4cHBsYPfI/tyDTM69N+4dWhyqcyJsIr8qlECgYEAnEnK/mM9RTGjn6XxnqKLdZSWtyA8KP6IdhzSmKzIsr+Vajwaaodt8yYjZFvCqzNC/ah5UbV7mtjvoeXDPAXkUNPY+NuQ1TWlN0qBBovt2hFhpOAbMoW/AYfeZRWhs8h+PE/vu9YGHfh8Oa8LXjKrB7dxtIX8XiMAI6zF0kUOu+0CgYEAxk6tWuxEMQcFeibitsTva7hwKblUB73wrQrs9hJQnxhhbk/IHdA3DUFBLpcmCxjcsFIxEYtyTWVbqK6hzCyFSHcBlAdfvIoT65cEA2RJdDprI9jMwM7NyQiisPqHXUJwPU8r4BKKXlaVj5NWJNCdAujG4L49gDe7aMfzBqKCAIECgYAc4jxMULUT8inke7QXMu7HqY4FY8yCvP+tTX8Y65u3GyMRoXXXlIuOGRtVZxY6s+S7nWSjjlzs+p9r/3RPgrr9TqVyE9hi1vqL/aoDNJ/tAU1DpVxyJYHDdWj8eoFtrj/sQQ/wpcxEAPcpIDdltmQS/qf+7JSpFDYFybJAxihMrQ==
-----END RSA PRIVATE KEY-----
`;
var aesKey;
var miniApp;

export function setAESKey(cipherText) {
    console.log("Setting AES key from cipher:", cipherText);
  
    let key = forge.pki.privateKeyFromPem(privateKeyPem);
    let encryptedBytes = forge.util.decode64(cipherText);
    let plainText = key.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');

    console.log("Decrypted AES key:", plainText);
    let data = plainText.split("|");
    aesKey = data[0];
    miniApp = data[1];
    console.warn("AES key:", aesKey);
    console.warn("Mini App ID:", miniApp);
}

export function encryptAES(plainText) {
    if (!aesKey) {
        console.error("AES key is not set. Cannot encrypt data.");
        return null;
    }
    // 1. Decode AES key from Base64 (same key from Kotlin getEncodedSecretKey())
    const rawKey = forge.util.decode64(aesKey);
    // 2. Generate a random 16-byte IV
    const iv = forge.random.getBytesSync(16);
    // 3. Create AES-CBC cipher
    const cipher = forge.cipher.createCipher("AES-CBC", rawKey);
    // 4. Start encryption with IV
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(plainText)));
    cipher.finish();
    // 5. Combine IV + ciphertext
    const encryptedBytes = iv + cipher.output.getBytes();
    // 6. Base64 encode the result
    return forge.util.encode64(encryptedBytes);
}

export function decryptAES(base64Data) {
    if (!aesKey) {
        console.error("AES key is not set. Cannot decrypt data.");
        return null;
    }
    // 1. Decode Base64 combined (IV + ciphertext)
    const combinedBytes = forge.util.decode64(base64Data);
    // 2. Extract IV (first 16 bytes) and ciphertext
    const iv = combinedBytes.substring(0, 16);
    const encryptedBytes = combinedBytes.substring(16);
    // 3. Decode the Base64 AES key (raw bytes)
    const rawKey = forge.util.decode64(aesKey);
    // 4. Create AES-CBC decipher
    const decipher = forge.cipher.createDecipher("AES-CBC", rawKey);
    // 5. Start decryption
    decipher.start({ iv: iv });
    decipher.update(forge.util.createBuffer(encryptedBytes));
    const success = decipher.finish();

    if (!success) {
        throw new Error("AES decryption failed");
    }

    return forge.util.decodeUtf8(decipher.output.getBytes());
}

