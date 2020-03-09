import uuid from 'uuid/v4';
import { getPublicKeyFromPrivate } from './helpers';
import { signECDSA } from './helpers';
import EventEmitter from 'wolfy87-eventemitter';
import RNBlockstack from 'react-native-blockstack';

import {
  decryptObject,
  encryptObject,
  requireUserSession,
  userGroupKeys,
} from './helpers';
import { count, destroyModel, find, IFindQuery, sendNewGaiaUrl } from './api';
import Streamer from './streamer';
import { IAttrs, ISchema } from './types';

const EVENT_NAME = 'MODEL_STREAM_EVENT';

interface IFetchOptions {
  decrypt?: boolean;
}

export default class Model {
  public static schema: ISchema;
  public static defaults: any = {};
  public static className?: string;
  public static emitter?: EventEmitter;

  public static fromSchema(schema: ISchema) {
    this.schema = schema;
    return this;
  }

  public static async fetchList<T extends Model>(
    _selector: IFindQuery = {},
    { decrypt = true }: IFetchOptions = {},
  ) {
    const selector: IFindQuery = {
      ..._selector,
      radiksType: this.modelName(),
    };
    const { results } = await find(selector);
    const Clazz = this;
    const modelDecryptions: Array<Promise<T>> = results.map((doc: any) => {
      const model = new Clazz(doc);
      if (decrypt) {
        return model.decrypt();
      }
      return Promise.resolve(model);
    });
    const models: T[] = await Promise.all(modelDecryptions);
    return models;
  }

  public static async findOne<T extends Model>(
    _selector: IFindQuery = {},
    options: IFetchOptions = { decrypt: true },
  ) {
    const selector: IFindQuery = {
      ..._selector,
      limit: 1,
    };
    const results: T[] = await this.fetchList(selector, options);
    return results[0];
  }

  public static async findById<T extends Model>(
    _id: string,
    fetchOptions?: Record<string, any>,
  ) {
    const Clazz = this;
    const model: Model = new Clazz({ _id } as any);
    return model.fetch(fetchOptions);
  }

  public static async count(_selector: IFindQuery = {}): Promise<number> {
    const selector: IFindQuery = {
      ..._selector,
      radiksType: this.modelName(),
    };
    const data = await count(selector);
    return data.total;
  }

  /**
   * Fetch all models that are owned by the current user.
   * This only includes 'personally' owned models, and not those created
   * as part of a UserGroup
   *
   * @param {Object} _selector - A query to include when fetching models
   */
  public static async fetchOwnList(_selector: IFindQuery = {}) {
    const userGroup = await userGroupKeys();
    const { _id } = userGroup.personal;
    const selector = {
      ..._selector,
      signingKeyId: _id,
    };
    return this.fetchList(selector);
  }

  public static modelName(): string {
    return this.className || this.name;
  }

  public static onStreamEvent = (_this: any, [event]: any) => {
    try {
      const { data } = event;
      const attrs = JSON.parse(data);
      if (attrs && attrs.radiksType === _this.modelName()) {
        const model = new _this(attrs);
        if (model.isOwnedByUser()) {
          model.decrypt().then(() => {
            _this.emitter.emit(EVENT_NAME, model);
          });
        } else {
          _this.emitter.emit(EVENT_NAME, model);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  public static addStreamListener(callback: () => void) {
    if (!this.emitter) {
      this.emitter = new EventEmitter();
    }
    if ((this.emitter as any).getListeners('').length === 0) {
      Streamer.addListener((args: any) => {
        this.onStreamEvent(this, args);
      });
    }
    this.emitter.addListener(EVENT_NAME, callback);
  }

  public static removeStreamListener(callback: () => void) {
    // @ts-ignore
    this.emitter.removeListener(EVENT_NAME, callback);
    // @ts-ignore
    if (this.emitter.getListeners().length === 0) {
      Streamer.removeListener(this.onStreamEvent);
    }
  }
  public schema: ISchema;
  public _id: string;
  public attrs: IAttrs;

  constructor(attrs: IAttrs) {
    const { schema, defaults } = this.constructor as typeof Model;
    const name = this.modelName();
    this.schema = schema;
    this._id = (attrs && attrs._id) || uuid().replace('-', '');
    this.attrs = {
      ...defaults,
      ...attrs,
      radiksType: name,
    };
  }

  public async save() {
    return new Promise(async (resolve, reject) => {
      try {
        // if (this.beforeSave) {
        //   await this.beforeSave();
        // }
        const now = new Date().getTime();
        this.attrs.updatedAt = now;
        this.attrs.createdAt = this.attrs.createdAt || now;
        this.attrs.updatedAt = now;
        await this.sign();

        const encrypted = await this.encrypted();

        const gaiaURL = await this.saveFile(encrypted);
        await sendNewGaiaUrl(gaiaURL.fileUrl);
        resolve(this);
      } catch (error) {
        reject(error);
      }
    });
  }

  public encrypted() {
    return encryptObject(this);
  }

  public saveFile(encrypted: Record<string, any>) {
    return RNBlockstack.putFile(
      this.blockstackPath(),
      JSON.stringify(encrypted),
      {
        encrypt: false,
      },
    );
  }

  public deleteFile() {
    const userSession = requireUserSession();
    return userSession.deleteFile(this.blockstackPath());
  }

  public blockstackPath() {
    return `${this.modelName()}/${this._id}`;
  }

  public async fetch({ decrypt = true } = {}): Promise<this | undefined> {
    const query = {
      _id: this._id,
    };
    const { results } = await find(query);
    const [attrs] = results;
    // Object not found on the server so we return undefined
    if (!attrs) {
      return undefined;
    }
    this.attrs = {
      ...this.attrs,
      ...attrs,
    };
    if (decrypt) {
      await this.decrypt();
    }
    await this.afterFetch();
    return this;
  }

  public async decrypt() {
    this.attrs = await decryptObject(this.attrs, this);
    return this;
  }

  public update(attrs: IAttrs) {
    this.attrs = {
      ...this.attrs,
      ...attrs,
    };
  }

  public sign = async () => {
    if (this.attrs.updatable === false) {
      return true;
    }
    const signingKey = await this.getSigningKey();
    this.attrs.signingKeyId = this.attrs.signingKeyId || signingKey._id;
    const { privateKey } = signingKey;
    const contentToSign: Array<string | number> = [this._id];
    if (this.attrs.updatedAt) {
      contentToSign.push(this.attrs.updatedAt);
    }
    const { signature } = signECDSA(privateKey, contentToSign.join('-'));
    this.attrs.radiksSignature = signature;
    return this;
  };

  public getSigningKey = async () => {
    if (this.attrs.userGroupId) {
      const { userGroups, signingKeys } = await userGroupKeys();

      const _id = userGroups[this.attrs.userGroupId];
      const privateKey = signingKeys[_id];
      return {
        _id,
        privateKey,
      };
    }
    const userGroupKey = await userGroupKeys();
    return userGroupKey.personal;
  };

  public encryptionPublicKey = async () => {
    return getPublicKeyFromPrivate(await this.encryptionPrivateKey());
  };

  public encryptionPrivateKey = async () => {
    let privateKey: string;
    if (this.attrs.userGroupId) {
      const { userGroups, signingKeys } = await userGroupKeys();
      privateKey = signingKeys[userGroups[this.attrs.userGroupId]];
    } else {
      privateKey = requireUserSession().loadUserData.private_key;
    }
    return privateKey;
  };

  public modelName(): string {
    const { modelName } = this.constructor as typeof Model;
    return modelName.apply(this.constructor);
  }

  public isOwnedByUser = async () => {
    const keys = await userGroupKeys();
    if (this.attrs.signingKeyId === keys.personal._id) {
      return true;
    }
    if (this.attrs.userGroupId) {
      let isOwned = false;
      Object.keys(keys.userGroups).forEach(groupId => {
        if (groupId === this.attrs.userGroupId) {
          isOwned = true;
        }
      });
      return isOwned;
    }
    return false;
  };

  public async destroy(): Promise<boolean> {
    const now = new Date().getTime();
    this.attrs.updatedAt = now;
    await this.sign();
    await this.deleteFile();
    return destroyModel(this);
  }

  // @abstract
  // public beforeSave() {}

  // @abstract
  // public afterFetch() {}
}
