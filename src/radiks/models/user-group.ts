import { getPublicKeyFromPrivate } from '../helpers';

import Model from '../model';
import GroupMembership from './group-membership';
import GroupInvitation from './group-invitation';
import SigningKey from './signing-key';
import { userGroupKeys, addUserGroupKey, loadUserData } from '../helpers';
import { ISchema } from '../types/index';

interface IMember {
  username: string;
  inviteId: string;
}

const defaultMembers: IMember[] = [];

export default class UserGroup extends Model {
  public static schema: ISchema = {
    name: String,
    gaiaConfig: Object,
    members: {
      type: Array,
    },
  };

  public static defaults = {
    members: defaultMembers,
  };

  public static async find(id: string) {
    const { userGroups, signingKeys } = await GroupMembership.userGroupKeys();
    if (!userGroups || !userGroups[id]) {
      throw new Error(
        `UserGroup not found with id: '${id}'. Have you called \`GroupMembership.cacheKeys()\`?`,
      );
    }
    const signingKey = userGroups[id];
    const privateKey = signingKeys[signingKey];
    const userGroup = new this({ _id: id } as any);
    userGroup.privateKey = privateKey;
    await userGroup.fetch();
    return userGroup;
  }

  public static async myGroups() {
    const { userGroups } = await userGroupKeys();
    const keys = Object.keys(userGroups);
    return this.fetchList({ key: keys.join(',') });
  }

  // async makeGaiaConfig() {
  //   const userData = loadUserData();
  //   const { private_key, hubUrl } = userData;
  //   const scopes = [
  //     {
  //       scope: 'putFilePrefix',
  //       domain: `UserGroups/${this._id}/`,
  //     },
  //   ];
  //   const userSession = requireUserSession();
  //   const gaiaConfig = await userSession.connectToGaiaHub(hubUrl, private_key, scopes);
  //   this.attrs.gaiaConfig = gaiaConfig;
  //   return gaiaConfig;
  // }

  public static modelName = () => 'UserGroup';
  public privateKey?: string;

  public async create() {
    const signingKey = await SigningKey.create({ userGroupId: this._id });
    this.attrs.signingKeyId = signingKey._id;
    this.privateKey = signingKey.attrs.privateKey;
    addUserGroupKey(this);
    // await this.makeGaiaConfig();
    const { username } = loadUserData();
    const invitation = await this.makeGroupMembership(username);
    await invitation.activate();
    return this;
  }

  public async makeGroupMembership(username: string): Promise<GroupInvitation> {
    let existingInviteId: any = null;
    this.attrs.members.forEach((member: IMember) => {
      if (member.username === username) {
        existingInviteId = member.inviteId;
      }
    });
    if (existingInviteId) {
      const existInvitation = await GroupInvitation.findById(existingInviteId, {
        decrypt: false,
      });
      return existInvitation as any;
    }
    const invitation = await GroupInvitation.makeInvitation(username, this);
    this.attrs.members.push({
      username,
      inviteId: invitation._id,
    });
    await this.save();
    return invitation;
  }

  public publicKey() {
    return getPublicKeyFromPrivate(this.privateKey || '');
  }

  public encryptionPublicKey = async () => {
    return this.publicKey();
  };

  public encryptionPrivateKey = async () => {
    if (this.privateKey) {
      return this.privateKey;
    }
    const { signingKeys } = await userGroupKeys();
    return signingKeys[this.attrs.signingKeyId];
  };

  public getSigningKey = async () => {
    const { userGroups, signingKeys } = await userGroupKeys();
    const id = userGroups[this._id];
    const privateKey = signingKeys[id];
    return {
      privateKey,
      id,
    };
  };
}
