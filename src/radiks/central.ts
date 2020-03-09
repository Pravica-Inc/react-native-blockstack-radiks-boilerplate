import { signECDSA } from './helpers';

import { getConfig } from './config';
import { saveCentral, fetchCentral } from './api';

class Central {
  public static save(key: string, value: Record<string, any>) {
    const { username, signature } = this.makeSignature(key);
    return saveCentral({
      username,
      key,
      value,
      signature,
    });
  }

  public static get(key: string) {
    const { username, signature } = this.makeSignature(key);

    return fetchCentral(key, username, signature);
  }

  public static makeSignature(key: string) {
    const { userSession } = getConfig();
    const { private_key, username } = (userSession as any).loadUserData();
    const message = `${username}-${key}`;

    const { signature } = signECDSA(private_key, message);

    return {
      username,
      signature,
    };
  }
}

export default Central;
