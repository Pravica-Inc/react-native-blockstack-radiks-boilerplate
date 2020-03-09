import Model from '../model';
import User from './user';
import UserGroup from './user-group';
import {
  clearStorage,
  userGroupKeys,
  GROUP_MEMBERSHIPS_STORAGE_KEY,
  loadUserData,
} from '../helpers';
import SigningKey from './signing-key';
import AsyncStorage from '@react-native-community/async-storage';

interface IUserGroupKeys {
  userGroups: {
    [userGroupId: string]: string;
  };
  signingKeys: {
    [signingKeyId: string]: string;
  };
}

export default class GroupMembership extends Model {
  public static className = 'GroupMembership';
  public static schema = {
    username: {
      type: String,
      decrypted: true,
    },
    signingKeyPrivateKey: String,
    signingKeyId: {
      type: String,
      decrypted: true,
    },
    userGroupId: {
      type: String,
      decrypted: true,
    },
  };

  public static async fetchUserGroups(): Promise<IUserGroupKeys> {
    const { username } = loadUserData();
    const memberships: any[] = await GroupMembership.fetchList({
      key: username,
    });
    const signingKeys: IUserGroupKeys['signingKeys'] = {};
    memberships.forEach(({ attrs }) => {
      signingKeys[attrs.signingKeyId] = attrs.signingKeyPrivateKey;
    });
    const fetchAll = memberships.map(membership =>
      membership.fetchUserGroupSigningKey(),
    );
    const userGroupList = await Promise.all(fetchAll);
    const userGroups: IUserGroupKeys['userGroups'] = {};
    userGroupList.forEach(userGroup => {
      userGroups[userGroup._id] = userGroup.signingKeyId;
    });
    return { userGroups, signingKeys };
  }

  public static cacheKeys = async () => {
    const { userGroups, signingKeys } = await GroupMembership.fetchUserGroups();
    console.log(userGroups, signingKeys);
    const groupKeys = await userGroupKeys();
    console.log('eh', loadUserData());
    const self: any = await User.findById(loadUserData().username);
    const key: any = await SigningKey.findById(self.attrs.personalSigningKeyId);
    console.log('hena')
    groupKeys.personal = key.attrs;
    groupKeys.signingKeys = signingKeys;
    groupKeys.userGroups = userGroups;
    AsyncStorage.setItem(
      GROUP_MEMBERSHIPS_STORAGE_KEY,
      JSON.stringify(groupKeys),
    );
  };

  public static async clearStorage() {
    clearStorage();
  }

  public static userGroupKeys() {
    return userGroupKeys();
  }

  public encryptionPublicKey = async () => {
    const user: any = await User.findById(this.attrs.username, {
      decrypt: false,
    });
    const { publicKey } = user.attrs;
    return publicKey;
  };

  public encryptionPrivateKey = () => {
    return loadUserData().private_key;
  };

  public getSigningKey = async () => {
    const {
      signingKeyId,
      signingKeyPrivateKey,
    }: {
      signingKeyId?: string;
      signingKeyPrivateKey?: string;
    } = this.attrs;
    return {
      _id: signingKeyId,
      privateKey: signingKeyPrivateKey,
    };
  };

  public fetchUserGroupSigningKey = async () => {
    const _id: string = this.attrs.userGroupId;
    const userGroup = (await UserGroup.findById<any>(_id)) as any;
    const signingKeyId  = userGroup?.attrs?.signingKeyId;
    return {
      _id,
      signingKeyId,
    };
  };
}
