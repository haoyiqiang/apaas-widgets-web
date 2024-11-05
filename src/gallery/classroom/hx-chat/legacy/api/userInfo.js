import { userInfoAction } from '../redux/actions/userAction';
import { roomUsersInfo } from '../redux/actions/roomAction';
import { WebIM } from '../utils/WebIM';

export class UserInfoAPI {
  store = null;
  constructor(store) {
    this.store = store;
  }

  // 设置自己的用户属性
  setUserInfo = (data) => {
    console.log(">>>>>>>>>>>>>>>setUserInfo", data)
    const { roleType, imAvatarUrl, userName, chatGroupUuids } = data
    const ext = JSON.stringify({
      role: roleType,
      chatGroupUuids
    });
    const defaultAvatarUrl =
      'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image1.png';
    const userAvatarUrl = imAvatarUrl || defaultAvatarUrl;
    const userNickName = userName;
    let options = {
      nickname: userNickName,
      avatarurl: userAvatarUrl,
      ext: ext,
    };
    WebIM.conn.updateOwnUserInfo(options).then((res) => {
      this.store.dispatch(userInfoAction(res.data));
    });
  };

  // 获取用户属性
  getUserInfo = async ({ member }) => {
    let count = 0;
    console.log(">>>>>>>>>>>>>>>>>>>>>res0", member)

    while (member.length > count) {
      let curmembers = member.slice(count, count + 100);
      console.log(">>>>>>>>>>>>>>>>>>>>>res1", curmembers)

      await WebIM.conn.fetchUserInfoById(curmembers).then((res) => {
        console.log(">>>>>>>>>>>>>>>>>>>>>res2", res)
        this.store.dispatch(roomUsersInfo(res.data));
      });
      count += 100;
    }
  };
}
