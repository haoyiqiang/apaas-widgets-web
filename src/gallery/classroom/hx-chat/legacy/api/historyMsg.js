import { WebIM } from '../utils/WebIM';
import { messageAction } from '../redux/actions/messageAction';
import { HISTORY_COUNT } from '../contants';
import { uniq } from 'lodash';
const getHistoryMsgs = (options) => {
  return new Promise((resolve, reject) => {
    WebIM.conn.fetchHistoryMessages({
      ...options,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    });
  })
}
const batchGetHistoryMsgs = (roomIds, options) => {
  let tasks = []
  for(let roomId of uniq(roomIds)){
    const task = getHistoryMsgs({
      queue: roomId,
      ...options
    })
    tasks.push(task)
  }
  return Promise.all(tasks)
}

export class ChatHistoryAPI {
  store = null;
  constructor(store, messageAPI) {
    this.store = store;
    this.messageAPI = messageAPI;
  }

  getHistoryMessages = async () => {
    const state = this.store.getState();
    const recvRoomIds = state?.propsData.recvRoomIds;
    const list = await batchGetHistoryMsgs(recvRoomIds, {
      isGroup: true,
      count: HISTORY_COUNT,
    })

    for(let item of list) {
      const historyMsg = item;
      let deleteMsgId = [];
      historyMsg.map((val, key) => {
        const {
          ext: { msgId },
        } = val;
        const { action, id } = val;
        if (action == 'DEL') {
          deleteMsgId.push(msgId);
          this.store.dispatch(messageAction(val, { showNotice: false, isHistory: true }));
        } else if (deleteMsgId.includes(id)) {
          return;
        } else {
          const newMessage = this.messageAPI.convertCustomMessage(val);
          this.store.dispatch(messageAction(newMessage, { showNotice: false, isHistory: true }));
        }
      });
    }
  };
}
