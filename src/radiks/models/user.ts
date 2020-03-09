import { getPublicKeyFromPrivate } from '../helpers';
import { signECDSA } from '../helpers';

import Model from '../model';
import SigningKey from './signing-key';
import GroupMembership from './group-membership';
import { addPersonalSigningKey, loadUserData } from '../helpers';
import { ISchema } from '../types/index';

const decrypted = true;

export default class BlockstackUser extends Model {
  public static className = 'BlockstackUser';

  public static schema: ISchema = {
    username: {
      type: String,
      decrypted,
    },
    publicKey: {
      type: String,
      decrypted,
    },
    profile: {
      type: String,
      decrypted,
    },
    personalSigningKeyId: String,
  };

  public static currentUser() {
    const userData = loadUserData();
    if (!userData) {
      return null;
    }

    const { username, profile, private_key } = userData;
    const publicKey = getPublicKeyFromPrivate(private_key);
    const Clazz = this;
    const user = new Clazz({
      _id: username,
      username,
      publicKey,
      profile,
    } as any);

    return user;
  }

  public static createWithCurrentUser() {
    return new Promise((resolve, reject) => {
      const resolveUser = (
        user: BlockstackUser,
        _resolve: (value?: {} | PromiseLike<{}>) => void,
      ) => {
        user.save().then(() => {
          GroupMembership.cacheKeys().then(() => {
            _resolve(user);
          });
        });
      };
      try {
        const user: any = this.currentUser();
        user.fetch().finally(() => {
          const userData = loadUserData();
          const { username, profile, private_key } = userData;
          const publicKey = getPublicKeyFromPrivate(private_key);
          user.update({
            username,
            profile,
            publicKey,
          });

          if (!user.attrs.personalSigningKeyId) {
            user.createSigningKey().then(async (key: any) => {
              await addPersonalSigningKey(key);
              resolveUser(user, resolve);
            });
          } else {
            SigningKey.findById(user.attrs.personalSigningKeyId).then(
              async (key: any) => {
                await addPersonalSigningKey(key);
                resolveUser(user, resolve);
              },
            );
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async createSigningKey() {
    const key = await SigningKey.create();
    this.attrs.personalSigningKeyId = key._id;
    return key;
  }

  public sign = async () => {
    this.attrs.signingKeyId = 'personal';
    const { private_key } = loadUserData();
    const contentToSign: Array<string | number> = [this._id];
    if (this.attrs.updatedAt) {
      contentToSign.push(this.attrs.updatedAt);
    }
    const { signature } = signECDSA(private_key, contentToSign.join('-'));
    this.attrs.radiksSignature = signature;
    return this;
  };
}

export const TWITTER_TYPE = 'twitter';
type twitterType = typeof TWITTER_TYPE;

export const GIT_HUB_TYPE = 'github';
type githubType = typeof GIT_HUB_TYPE;

export const HACKER_NEWS_TYPE = 'hackerNews';
type hackerNewsType = typeof HACKER_NEWS_TYPE;

export const FACEBOOK_TYPE = 'facebook';
type facebookType = typeof FACEBOOK_TYPE;

export const INSTAGRAM_TYPE = 'instagram';
type instagramType = typeof INSTAGRAM_TYPE;

export const LINKED_IN_TYPE = 'linkedIn';
type linkedInType = typeof LINKED_IN_TYPE;

export interface IAccount {
  service:
    | twitterType
    | githubType
    | facebookType
    | hackerNewsType
    | instagramType
    | linkedInType;
  proofUrl: string;
}

export interface IUser {
  username: string;
  profile: {
    account: IAccount[];
    description?: string;
    apps: { [x: string]: string };
    image: Array<{ contentUrl: string; name: string }>;
    name: string;
  };
}
