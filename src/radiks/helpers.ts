import { getConfig } from './config';
import AsyncStorage from '@react-native-community/async-storage';
import { Buffer } from 'buffer';
import Model from './model';
import { ISchemaAttribute } from './types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ECPair, address as baddress, crypto as bcrypto } from 'bitcoinjs-lib';
import { ec as EllipticCurve } from 'elliptic';
import BN from 'bn.js';
import crypto, { randomBytes, randomFillSync } from 'crypto';
import UserGroup from './models/user-group';
export const GROUP_MEMBERSHIPS_STORAGE_KEY = 'GROUP_MEMBERSHIPS_STORAGE_KEY';
const ecurve = new EllipticCurve('secp256k1');

const valueToString = (value: any, clazz: any) => {
  if (clazz === Boolean) {
    return value ? 'true' : 'false';
  }
  if (clazz === Number) {
    return String(value);
  }
  if (clazz === Array || clazz === Object) {
    return JSON.stringify(value);
  }
  return value;
};
const stringToValue = (value: string, clazz: any) => {
  if (clazz === Boolean) {
    return value === 'true';
  }
  if (clazz === Number) {
    return parseFloat(value);
  }
  if (clazz === Array || clazz === Object) {
    return JSON.parse(value);
  }
  return value;
};

export const decryptObject = async (encrypted: any, model: Model) => {
  const privateKey = await model.encryptionPrivateKey();
  const decrypted = {
    ...encrypted,
  };
  const { schema } = model;
  Object.keys(encrypted).forEach(key => {
    const value = encrypted[key];
    const schemaValue = schema[key];
    let clazz = schemaValue;
    const schemaAttribute = schema[key] as ISchemaAttribute;
    if (schemaAttribute && schemaAttribute.type) {
      clazz = schemaAttribute.type;
    }
    if (clazz && schemaAttribute && !schemaAttribute.decrypted) {
      try {
        const decryptedValue = decryptECIES(privateKey, value) as string;
        decrypted[key] = stringToValue(decryptedValue, clazz);
      } catch (error) {
        decrypted[key] = value;
      }
    }
  });
  return decrypted;
};

export const encryptObject = async (model: Model) => {
  const publicKey = await model.encryptionPublicKey();
  const object = model.attrs;
  const encrypted = {
    ...object,
    _id: model._id,
  };
  Object.keys(model.schema).forEach(key => {
    const schemaValue = model.schema[key];
    const schemaAttribute = model.schema[key] as ISchemaAttribute;
    const value = object[key];
    let clazz = schemaValue;
    if (typeof value === 'undefined') {
      return;
    }
    if (schemaAttribute.type) {
      clazz = schemaAttribute.type;
    }
    if (schemaAttribute.decrypted) {
      (encrypted as any)[key] = value;
      return;
    }
    const stringValue = valueToString(value, clazz);
    (encrypted as any)[key] = encryptECIES(publicKey, stringValue);
  });
  return encrypted;
};

export const clearStorage = async () => {
  await AsyncStorage.removeItem(GROUP_MEMBERSHIPS_STORAGE_KEY);
};

export const userGroupKeys = async () => {
  const keysString = await AsyncStorage.getItem(GROUP_MEMBERSHIPS_STORAGE_KEY);
  let keys = keysString ? JSON.parse(keysString) : {};
  keys = {
    userGroups: {},
    signingKeys: {},
    personal: {},
    ...keys,
  };
  return keys;
};

export const addPersonalSigningKey = async (signingKey: any) => {
  const keys = await userGroupKeys();
  keys.personal = {
    _id: signingKey._id,
    ...signingKey.attrs,
  };
  await AsyncStorage.setItem(
    GROUP_MEMBERSHIPS_STORAGE_KEY,
    JSON.stringify(keys),
  );
};

export const addUserGroupKey = async (userGroup: UserGroup) => {
  const keys = await userGroupKeys();
  keys.userGroups[userGroup._id] = userGroup.attrs.signingKeyId;
  keys.signingKeys[userGroup.attrs.signingKeyId] = userGroup.privateKey;
  await AsyncStorage.setItem(
    GROUP_MEMBERSHIPS_STORAGE_KEY,
    JSON.stringify(keys),
  );
};

export const requireUserSession = () => {
  const { userSession } = getConfig();
  if (!userSession) {
    // TODO: link to docs
    throw new Error('You have not properly configured your UserSession.');
  }
  return userSession;
};

export const loadUserData = () => {
  const { userSession } = getConfig();
  if (userSession) {
    return userSession.loadUserData;
  }
  return {
    username: '',
    private_key: '',
    profile: '',
  };
};

export function getPublicKeyFromPrivate(privateKey: string) {
  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return keyPair.publicKey.toString('hex');
}

export function decryptECIES(
  privateKey: string,
  cipherObject: CipherObject,
): Buffer | string {
  const ecSK = ecurve.keyFromPrivate(privateKey, 'hex');
  const ephemeralPK = ecurve
    .keyFromPublic(cipherObject.ephemeralPK, 'hex')
    .getPublic();
  const sharedSecret = ecSK.derive(ephemeralPK);
  const sharedSecretBuffer = Buffer.from(getHexFromBN(sharedSecret), 'hex');

  const sharedKeys = sharedSecretToKeys(sharedSecretBuffer);

  const ivBuffer = Buffer.from(cipherObject.iv, 'hex');
  const cipherTextBuffer = Buffer.from(cipherObject.cipherText, 'hex');

  const macData = Buffer.concat([
    ivBuffer,
    Buffer.from(ephemeralPK.encodeCompressed()),
    cipherTextBuffer,
  ]);
  const actualMac = hmacSha256(sharedKeys.hmacKey, macData);
  const expectedMac = Buffer.from(cipherObject.mac, 'hex');
  if (!equalConstTime(expectedMac, actualMac)) {
    throw new Error('Decryption failed: failure in MAC check');
  }
  const plainText = aes256CbcDecrypt(
    ivBuffer,
    sharedKeys.encryptionKey,
    cipherTextBuffer,
  );
  if (cipherObject.wasString) {
    return plainText.toString();
  } else {
    return plainText;
  }
}

/**
 * Sign content using ECDSA
 *
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 * @private
 * @ignore
 */
export function signECDSA(
  privateKey: string,
  content: string | Buffer,
): {
  publicKey: string;
  signature: string;
} {
  const contentBuffer =
    content instanceof Buffer ? content : Buffer.from(content);
  const ecPrivate = ecurve.keyFromPrivate(privateKey, 'hex');
  const publicKey = getPublicKeyFromPrivate(privateKey);
  const contentHash = crypto
    .createHash('sha256')
    .update(contentBuffer)
    .digest();
  const signature = ecPrivate.sign(contentHash);
  const signatureString = signature.toDER('hex');

  return {
    signature: signatureString,
    publicKey,
  };
}
function sharedSecretToKeys(sharedSecret: Buffer) {
  // generate mac and encryption key from shared secret
  const hashedSecret = crypto
    .createHash('sha512')
    .update(sharedSecret)
    .digest();
  return {
    encryptionKey: hashedSecret.slice(0, 32),
    hmacKey: hashedSecret.slice(32),
  };
}

function aes256CbcDecrypt(iv: Buffer, key: Buffer, ciphertext: Buffer) {
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(ciphertext), cipher.final()]);
}

export type CipherObject = {
  iv: string;
  ephemeralPK: string;
  cipherText: string;
  mac: string;
  wasString: boolean;
};

function equalConstTime(b1: Buffer, b2: Buffer) {
  if (b1.length !== b2.length) {
    return false;
  }
  let res = 0;
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]; // jshint ignore:line
  }
  return res === 0;
}

function hmacSha256(key: Buffer, content: Buffer) {
  return crypto
    .createHmac('sha256', key)
    .update(content)
    .digest();
}

export function getHexFromBN(bnInput: BN) {
  const hexOut = bnInput.toString('hex');

  if (hexOut.length === 64) {
    return hexOut;
  } else if (hexOut.length < 64) {
    // pad with leading zeros
    // the padStart function would require node 9
    const padding = '0'.repeat(64 - hexOut.length);
    return `${padding}${hexOut}`;
  } else {
    throw new Error('Generated a > 32-byte BN for encryption. Failing.');
  }
}

export function encryptECIES(
  publicKey: string,
  content: string | Buffer,
): CipherObject {
  const isString = typeof content === 'string';
  // always copy to buffer
  const plainText =
    content instanceof Buffer ? Buffer.from(content) : Buffer.from(content);

  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic() as any;
  const ephemeralSK = ecurve.genKeyPair();
  const ephemeralPK = ephemeralSK.getPublic();
  const sharedSecret = ephemeralSK.derive(ecPK) as BN;

  const sharedSecretHex = getHexFromBN(sharedSecret);

  const sharedKeys = sharedSecretToKeys(Buffer.from(sharedSecretHex, 'hex'));

  const initializationVector = crypto.randomBytes(16);

  const cipherText = aes256CbcEncrypt(
    initializationVector,
    sharedKeys.encryptionKey,
    plainText,
  );

  const macData = Buffer.concat([
    initializationVector,
    Buffer.from(ephemeralPK.encodeCompressed()),
    cipherText,
  ]);
  const mac = hmacSha256(sharedKeys.hmacKey, macData);

  return {
    iv: initializationVector.toString('hex'),
    ephemeralPK: ephemeralPK.encodeCompressed('hex'),
    cipherText: cipherText.toString('hex'),
    mac: mac.toString('hex'),
    wasString: isString,
  };
}

function aes256CbcEncrypt(iv: Buffer, key: Buffer, plaintext: Buffer) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}
export function getEntropy(arg: Buffer | number): Buffer {
  if (!arg) {
    arg = 32;
  }
  if (typeof arg === 'number') {
    return randomBytes(arg);
  } else {
    return randomFillSync(arg);
  }
}
/**
 * @ignore
 */
export function makeECPrivateKey() {
  const keyPair: any = ECPair.makeRandom({ rng: getEntropy });
  return keyPair.privateKey.toString('hex');
}

export function verifyECDSA(content: any, publicKey: any, signature: any) {
  const contentBuffer = getBuffer(content);
  const ecPublic = ecurve.keyFromPublic(publicKey, 'hex');
  const contentHash = crypto
    .createHash('sha256')
    .update(contentBuffer)
    .digest();
  return ecPublic.verify(contentHash, signature);
}
function getBuffer(content: any) {
  if (content instanceof Buffer) {
    return content;
  } else if (content instanceof ArrayBuffer) {
    return Buffer.from(content);
  } else {
    return Buffer.from(content);
  }
}
