export interface ISchemaAttribute {
  type: string | Record<string, any> | any[] | number | boolean;
  decrypted?: boolean;
}

export interface ISchema {
  [key: string]:
    | ISchemaAttribute
    | string
    | Record<string, any>
    | any[]
    | number
    | boolean;
}

export interface IAttrs {
  createdAt?: number;
  updatedAt?: number;
  signingKeyId: string;
  _id?: string;
  [key: string]: any;
}

interface IGaiaScope {
  scope: string;
  domain: string;
}

export interface IUserSession {
  loadUserData: () => {
    private_key: string;
    profile: Record<string, any>;
    username: string;
    hubUrl: string;
  };

  putFile: (path: string, value: any, options: any) => string;
  connectToGaiaHub: (
    url: string,
    privateKey: string,
    scopes: IGaiaScope[],
  ) => any;
}
