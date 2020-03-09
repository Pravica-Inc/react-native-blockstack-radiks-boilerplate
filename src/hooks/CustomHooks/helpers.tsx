import { IUser } from '../../radiks/models/user';

export const removeDubs = (arr: any, filter = 'id') => {
  const unique: any = {};
  arr.forEach((i: any) => {
    if (!unique[i[filter]]) {
      unique[i[filter]] = i;
    } else if (filter === 'id' && unique[i[filter]].updatedAt < i.updatedAt) {
      unique[i[filter]] = i;
    } else if (
      filter === '_id' &&
      unique[i[filter]].attrs.updatedAt < i.attrs.updatedAt
    ) {
      unique[i[filter]] = i;
    }
  });
  return ((Object as any).values(unique) as any) || [];
};

export const getUserImage = (userData: IUser) => {
  const isUserImageAvailable =
    userData &&
    userData.profile &&
    userData.profile.image &&
    userData.profile.image.length > 0 &&
    userData.profile.image.filter(item => item.name === 'avatar').length > 0;
  return isUserImageAvailable
    ? userData.profile.image.filter(item => item.name === 'avatar')[0]
        .contentUrl
    : 'https://i.imgur.com/JyMVnLz.png';
};
