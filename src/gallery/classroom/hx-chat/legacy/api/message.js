import { WebIM } from '../utils/WebIM';
import { MSG_TYPE } from '../contants';
import { messageAction } from '../redux/actions/messageAction';
import { message } from 'antd';
import { transI18n } from 'agora-common-libs';
const sendMsg = (id, type, options) => {
  return new Promise((resolve, reject) => {
      let msg = new WebIM.message(type, id); // 创建文本消息
      msg.set({
          ...options,
          success: function(id, serverId) {
              console.log(">>>>>>>>>>>>succ")
              resolve(msg)
          },
          fail: function(err){
            console.log(">>>>>>>>>>>>fail")
              reject(err)
          }
      });
      WebIM.conn.send(msg.body);
  })
}

const batchSendMsg = (type, roomIds, options) => {
  let sendTasks = []
  let localMsgId = WebIM.conn.getUniqueId(); // 生成本地消息id

  for (let roomId of roomIds) {
      const task = sendMsg(localMsgId, type, {
          to: roomId,
          ...options
      })
      sendTasks.push(task)
  }

  return Promise.all(sendTasks)
}

export class MessageAPI {
  store = null;
  constructor(store) {
    this.store = store;
  }

  removeMsg = async (recallId) => {
    const state = this.store.getState();
    const roomUuid = state?.propsData.roomUuid;
    const roleType = state?.propsData.roleType;
    const loginName = state?.propsData.userName;
    const loginUser = state?.propsData.userUuid;
    const sendRoomIds = state?.sendRoomIds;
    const publicRoomId = state?.propsData?.chatRoomId;
    let options = {
      action: 'DEL', //用户自定义，cmd消息必填
      chatType: 'chatRoom',
      from: loginUser,
      ext: {
        msgtype: MSG_TYPE.common, // 消息类型
        roomUuid: roomUuid,
        msgId: recallId,
        role: roleType,
        nickName: loginName,
      }, //用户自扩展的消息内容（群聊用法相同）
    }
    const [msg] = await batchSendMsg('cmd', [publicRoomId, ...sendRoomIds], options)
    this.store.dispatch(messageAction(msg.body, { isHistory: false }));
  }

  // 禁言消息
  sendCmdMsg = async (action, userId) => {
    const state = this.store.getState();
    const publicRoomId = state?.propsData?.chatRoomId;
    const sendRoomIds = state?.sendRoomIds;
    const roomUuid = state?.propsData.roomUuid;
    const roleType = state?.propsData.roleType;
    const loginName = state?.propsData.userName;
    const loginUser = state?.propsData.userUuid;
    let options = {
      action: action, //用户自定义，cmd消息必填
      chatType: 'chatRoom',
      from: loginUser,
      ext: {
        msgtype: MSG_TYPE.common, // 消息类型
        roomUuid: roomUuid,
        role: roleType,
        muteMember: userId || '',
        muteNickName: (userId && state.room.roomUsersInfo[userId].nickname) || '',
        nickName: loginName,
      }, //用户自扩展的消息内容（群聊用法相同）
      success: (id, serverId) => {
        msg.id = serverId;
        msg.body.id = serverId;
        msg.body.time = new Date().getTime().toString();
        this.store.dispatch(messageAction(msg.body, { isHistory: false }));
      }, //消息发送成功回调
      fail: (e) => {
        console.log('Fail'); //如禁言、拉黑后发送消息会失败
      },
    }
    const [msg] = await batchSendMsg('cmd', [publicRoomId,...sendRoomIds], options)
    this.store.dispatch(messageAction(msg.body, { isHistory: false }));
  };

  sendTxtMsg = async (content) => {
    const state = this.store.getState();
    const userUuid = state?.propsData.userUuid;
    const publicRoomId = state?.propsData?.chatRoomId;
    const roleType = state?.propsData.roleType;
    const roomUuid = state?.propsData.roomUuid;
    const userNickName = state?.propsData.userName;
    const userAvatarUrl = state?.loginUserInfo.avatarurl;
    const sendRoomIds = state?.sendRoomIds;
    const isQuestion = state?.isQuestion
    let options = {
      msg: content,
      from: userUuid,
      chatType: 'chatRoom', // 群聊类型设置为聊天室
      ext: {
          msgtype: MSG_TYPE.common, // 消息类型
          roomUuid: roomUuid,
          role: roleType,
          avatarUrl: userAvatarUrl || '',
          nickName: userNickName,
          isQuestion: isQuestion,
      }, // 扩展消息
    }

    const [msg] = await batchSendMsg('txt', [publicRoomId,...sendRoomIds], options)
    this.store.dispatch(messageAction(msg.body, { isHistory: false }));
  }

  //图片消息
  sendImgMsg = (couterRef, fileData) => {
    // e.preventDefault();
    const state = this.store.getState();
    const loginUser = state?.propsData.userUuid;
    const publicRoomId = state?.propsData?.chatRoomId;
    const roleType = state?.propsData.roleType;
    const roomUuid = state?.propsData.roomUuid;
    const userNickName = state?.propsData.userName;
    const userAvatarUrl = state?.loginUserInfo.avatarurl;
    const sendRoomIds = state?.sendRoomIds;

    var id = WebIM.conn.getUniqueId(); // 生成本地消息id
    // var msg = new WebIM.message('img', id); // 创建图片消息
    
    let file = fileData ? fileData : WebIM.utils.getFileUrl(couterRef.current); // 将图片转化为二进制文件
    var allowType = {
      jpeg: true,
      jpg: true,
      png: true,
      bmp: true,
    };
    let img = new Image();
    img.src = file.url;
    //加载后才能拿到宽和高
    img.onload = async () => {
      if (file.filetype.toLowerCase() in allowType) {
        var option = {
          file: file,
          to: publicRoomId,
          from: loginUser,
          ext: {
            msgtype: MSG_TYPE.common, // 消息类型
            roomUuid: roomUuid,
            role: roleType,
            avatarUrl: userAvatarUrl || '',
            nickName: userNickName,
          },
          width: img.width,
          height: img.height,
          chatType: 'chatRoom',
          onFileUploadError: (err) => {
            // 消息上传失败
            message.error(transI18n('chat.uploading_picture'));
            console.log('onFileUploadError>>>', err);
          },
          onFileUploadComplete: (res) => {
            // 消息上传成功
            console.log('onFileUploadComplete>>>', res);
          },
          flashUpload: WebIM.flashUpload,
        };

        try{
          const [msg] = await batchSendMsg('img', [publicRoomId, ...sendRoomIds], option)
          this.store.dispatch(messageAction(msg.body, { isHistory: false }));
        } catch(err) {
          couterRef.current.value = null;
        }
      }
    };
  };

  convertCustomMessage = (message) => {
    if (message?.ext?.range === 3) {
      const customMessage = {
        ...message,
        ext: {
          ...message.ext,
          avatarUrl:
            'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/IMDemo/avatar/Image1.png',
          nickName: message.ext.nickName,
          role: +message.ext.role,
        },
      };
      return customMessage;
    }
    return message;
  };
}
