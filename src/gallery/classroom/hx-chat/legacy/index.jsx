/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'agora-common-libs';
import { setVisibleUI, roomUserCount } from './redux/actions/roomAction';
import { isShowChat, isShowMiniIcon, setAPIs } from './redux/actions/propsAction';
import { messageAction } from './redux/actions/messageAction';
import App from './App';
import { ChatRoomAPI } from './api/chatroom';
import { ChatHistoryAPI } from './api/historyMsg';
import { LoginAPI } from './api/login';
import { MessageAPI } from './api/message';
import { MuteAPI } from './api/mute';
import { UserInfoAPI } from './api/userInfo';
import { PresenceAPI } from './api/presence';
import { setCredential } from './api/base';

let store = null;

export const HXChatRoom = ({
  pluginStore,
  agoraTokenData,
  theme,
  chatStore,
  searchKeyword,
  keyWordChangeHandle,
  userList,
  hasMoreUsers,
  fetchNextUsersList,
  startAutoFetch,
  stopAutoFetch,
}) => {
  store = chatStore;
  const chatAPIs = React.useMemo(() => {
    setCredential(agoraTokenData.userUuid, agoraTokenData.token);
    const loginAPI = new LoginAPI(chatStore);
    const messageAPI = new MessageAPI(chatStore);
    const chatHistoryAPI = new ChatHistoryAPI(chatStore, messageAPI);
    const muteAPI = new MuteAPI(chatStore, messageAPI);
    const userInfoAPI = new UserInfoAPI(chatStore);
    const presenceAPI = new PresenceAPI(chatStore);
    const chatRoomAPI = new ChatRoomAPI(
      chatStore,
      chatHistoryAPI,
      muteAPI,
      userInfoAPI,
      presenceAPI,
    );

    return {
      chatRoomAPI,
      chatHistoryAPI,
      loginAPI,
      messageAPI,
      muteAPI,
      userInfoAPI,
      presenceAPI,
    };
  }, [chatStore]);

  useEffect(() => {
    chatStore.dispatch(setAPIs(chatAPIs));
    return () => {
      chatAPIs.chatRoomAPI.logoutChatroom();
      // chatStore.dispatch({ type: 'RESET_ACTION' });
    };
  }, [chatStore, chatAPIs]);

  return (
    // <React.StrictMode>
    <Provider store={chatStore} apis={chatAPIs}>
      <ThemeProvider value={theme}>
        <App
          pluginStore={pluginStore}
          agoraTokenData={agoraTokenData}
          searchKeyword={searchKeyword}
          userList={userList}
          keyWordChangeHandle={keyWordChangeHandle}
          hasMoreUsers={hasMoreUsers}
          fetchNextUsersList={fetchNextUsersList}
          startAutoFetch={startAutoFetch}
          stopAutoFetch={stopAutoFetch}
        />
      </ThemeProvider>
    </Provider>
    // </React.StrictMode>
  );
};
// 单人禁言
export const muteUser = (userId) => {
  store?.getState().apis.setUserMute(userId);
};

// 解除单人禁言
export const unMuteUser = (userId) => {
  store?.getState().apis.removeUserMute(userId);
};

// 当前登陆ID，是否被禁言 --- 学生调用 返回 Boolean
export const isMuted = () => {
  return store?.getState()?.room.isUserMute;
};

// 获取禁言列表 --- 老师调用  返回 userUuid 的数组
export const getMuteList = () => {
  return store?.getState()?.room.muteList;
};
export const dispatchVisibleUI = (data) => {
  return store?.dispatch(setVisibleUI(data));
};
export const dispatchShowChat = (data) => {
  return store?.dispatch(isShowChat(data));
};
export const dispatchShowMiniIcon = (data) => {
  return store?.dispatch(isShowMiniIcon(data));
};
/**
 * 成员数量改变
 */
export const dispatchMemberCountChange = (data) => {
  return store?.dispatch(roomUserCount(data));
};

/**
 * 让外部可以插入到消息插入到消息列表中
 * @param {*} data
 * @returns
 */
export const receiveMessage = (data) => {
  return store?.dispatch(messageAction(data));
};
