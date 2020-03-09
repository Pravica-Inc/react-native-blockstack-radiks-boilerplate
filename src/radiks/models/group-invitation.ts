import Model from '../model';
import User from './user';
import GroupMembership from './group-membership';
import UserGroup from './user-group';
import { userGroupKeys, requireUserSession } from '../helpers';
import { ISchema } from '../types';

export default class GroupInvitation extends Model {
  public static className = 'GroupInvitation';
  public userPublicKey: string | undefined;

  public static schema: ISchema = {
    userGroupId: String,
    signingKeyPrivateKey: String,
    signingKeyId: {
      type: String,
      decrypted: true,
    },
  };

  public static defaults = {
    updatable: false,
  };

  public static async makeInvitation(username: string, userGroup: UserGroup) {
    const user = new User({ _id: username } as any);
    await user.fetch({ decrypt: false });
    const { publicKey } = user.attrs;
    const invitation = new this({
      userGroupId: userGroup._id,
      signingKeyPrivateKey: userGroup.privateKey,
      signingKeyId: userGroup.attrs.signingKeyId,
    });
    invitation.userPublicKey = publicKey;
    await invitation.save();
    return invitation;
  }

  public async activate() {
    const { userGroups } = await userGroupKeys();
    const groupId: string = this.attrs.userGroupId as string;
    if (userGroups[groupId]) {
      return true;
    }
    const groupMembership = new GroupMembership({
      userGroupId: this.attrs.userGroupId,
      username: requireUserSession().loadUserData.username,
      signingKeyPrivateKey: this.attrs.signingKeyPrivateKey,
      signingKeyId: this.attrs.signingKeyId,
    });
    await groupMembership.save();
    await GroupMembership.cacheKeys();
    return groupMembership;
  }

  public encryptionPublicKey = async () => {
    return this.userPublicKey as string;
  };

  public encryptionPrivateKey = async () => {
    return requireUserSession().loadUserData.private_key;
  };
}
