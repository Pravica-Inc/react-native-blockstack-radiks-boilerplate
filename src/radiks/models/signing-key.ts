import { makeECPrivateKey, getPublicKeyFromPrivate } from '../helpers';

import Model from '../model';
import { loadUserData } from '../helpers';

export default class SigningKey extends Model {
  public static className = 'SigningKey';

  public static schema = {
    publicKey: {
      type: String,
      decrypted: true,
    },
    privateKey: String,
    userGroupId: {
      type: String,
      decrypted: true,
    },
  };

  public static defaults = {
    updatable: false,
  };

  public static async create(attrs = {}) {
    const privateKey = makeECPrivateKey();
    const publicKey = getPublicKeyFromPrivate(privateKey);
    const signingKey = new SigningKey({
      ...attrs,
      publicKey,
      privateKey,
    } as any);
    await signingKey.save.apply(signingKey);
    return signingKey;
  }

  public encryptionPrivateKey = () => loadUserData().private_key;
}
