/* eslint-disable react/prop-types */
import { useState, Fragment } from 'react';
import { useStore } from 'react-redux';
import { Tabs } from 'antd';
import { MessageBox } from '../MessageBox';
import { InputBox } from '../InputBox';
import { UserList } from '../UserList';
import { Announcement } from '../Announcement';
import { ROLE, CHAT_TABS_KEYS } from '../../contants';
import { isShowChat } from '../../redux/actions/propsAction';
import { selectTabAction, showRedNotification } from '../../redux/actions/messageAction';
import { transI18n } from 'agora-common-libs';
import { announcementNotice } from '../../redux/actions/roomAction';
// import minimize from '../../themes/img/minimize.png';
import minimize from '../../themes/svg/minimize.svg';
import notice from '../../themes/img/notice.png';
// import concat from 'lodash/concat';
// import assign from 'lodash/assign';
import './index.css';
import { useShallowEqualSelector } from '../../utils';

const { TabPane } = Tabs;

// 主页面，定义 tabs
export const Chat = ({
  searchKeyword,
  keyWordChangeHandle,
  userList,
  hasMoreUsers,
  fetchNextUsersList,
  startAutoFetch,
  stopAutoFetch,
}) => {
  const [tabKey, setTabKey] = useState(CHAT_TABS_KEYS.chat);
  // const [roomUserList, setRoomUserList] = useState([]);
  // const [roomMemberCount, setRoomMemberCount] = useState(0);
  const {
    // isLogin,
    announcement,
    showRed,
    showAnnouncementNotice,
    roleType,
    // roomUsers,
    // roomUsersInfo,
    showMIniIcon,
    // memberCount,
    configUIVisible,
  } = useShallowEqualSelector((state) => {
    return {
      // isLogin: _.get(state, 'isLogin'),
      announcement: _.get(state, 'room.announcement', ''),
      showRed: _.get(state, 'showRed'),
      showAnnouncementNotice: _.get(state, 'showAnnouncementNotice'),
      roleType: _.get(state, 'propsData.roleType', ''),
      // roomUsers: _.get(state, 'room.roomUsers', []),
      // memberCount: _.get(state, 'room.memberCount', 0),
      // roomUsersInfo: _.get(state, 'room.roomUsersInfo', {}),
      showMIniIcon: _.get(state, 'isShowMiniIcon'),
      configUIVisible: _.get(state, 'configUIVisible'),
    };
  });
  const store = useStore();
  // 直接在 propsData 中取值
  const isTeacher =
    roleType === ROLE.teacher.id || roleType === ROLE.assistant.id || roleType === ROLE.observer.id;

  const isAssistant = roleType === ROLE.assistant.id ;
  // useEffect(() => {
  //   // 加载成员信息
  //   let _speakerTeacher = [];
  //   let _assistant = [];
  //   let _student = [];
  //   if (isLogin) {
  //     let val;
  //     roomUsers.map((item) => {
  //       if (item === '系统管理员') return;
  //       if (Object.keys(roomUsersInfo).length > 0) {
  //         val = roomUsersInfo[item];
  //       }
  //       let newVal;
  //       let role = val && val.ext && JSON.parse(val.ext).role;
  //       switch (role) {
  //         case 1:
  //           newVal = assign(val, { id: item });
  //           _speakerTeacher.push(newVal);
  //           break;
  //         case 2:
  //           newVal = assign(val, { id: item });
  //           _student.push(newVal);
  //           break;
  //         case 3:
  //           newVal = assign(val, { id: item });
  //           _assistant.push(newVal);
  //           break;
  //         default:
  //           break;
  //       }
  //     });
  //     // setRoomUserList(concat(_speakerTeacher, _student));
  //   }
  // }, [roomUsers, roomUsersInfo]);
  // useEffect(() => {
  //   setRoomMemberCount(memberCount);
  //   // eslint-disable-next-line react/prop-types
  //   if (userList.length == 0) {
  //     fetchNextUsersList(null, true);
  //   }
  // }, [memberCount]);
  // useEffect(() => {
  //   setRoomUserList(userList);
  // }, [userList]);

  const hideChatModal = () => {
    store.dispatch(isShowChat(false));
    store.dispatch(selectTabAction(CHAT_TABS_KEYS.chat));
  };

  // 监听 Tab 切换
  const onTabChange = (key) => {
    store.dispatch(selectTabAction(key));
    switch (key) {
      case 'CHAT':
        setTabKey(CHAT_TABS_KEYS.chat);
        store.dispatch(showRedNotification(false));
        break;
      case 'USER':
        setTabKey(CHAT_TABS_KEYS.user);
        break;
      case 'ANNOUNCEMENT':
        setTabKey(CHAT_TABS_KEYS.notice);
        store.dispatch(announcementNotice(false));
        break;
      default:
        break;
    }

    if (key === 'USER') {
      fetchNextUsersList({}, true);
      startAutoFetch();
    } else {
      stopAutoFetch();
    }
  };

  // 点击聊天Tab中的公告，跳转到公告Tab
  const toTabKey = () => {
    setTabKey(CHAT_TABS_KEYS.notice);
    store.dispatch(announcementNotice(false));
  };

  const onScroll = () => {
    stopAutoFetch();
  };

  return (
    <div>
      <Tabs onChange={onTabChange} activeKey={tabKey} className={'chat-widget'}>
        <TabPane
          tab={
            <div>
              {showRed && <div className="fcr-hx-red-notice"></div>}
              {transI18n('chat.chat')}
            </div>
          }
          key={CHAT_TABS_KEYS.chat}>
          {announcement && (
            <div
              className="fcr-hx-notice"
              onClick={() => {
                toTabKey();
              }}>
              <img src={notice} className="fcr-hx-notice-icon" />
              <span className="fcr-hx-notice-text">{announcement}</span>
            </div>
          )}
          {tabKey === CHAT_TABS_KEYS.chat && <MessageBox />}
          <InputBox />
        </TabPane>
        {configUIVisible.memebers && isAssistant && (
          <TabPane tab={<MemberCount />} key={CHAT_TABS_KEYS.user}>
            <UserList
              roomUserList={userList}
              keyword={searchKeyword}
              onKeywordChange={keyWordChangeHandle}
              hasMoreUsers={hasMoreUsers}
              fetchNextUsersList={fetchNextUsersList}
              onScroll={onScroll}></UserList>
          </TabPane>
        )}
        {configUIVisible.announcement && (
          <TabPane
            tab={
              <div>
                {showAnnouncementNotice && <div className="fcr-hx-red-notice"></div>}
                {transI18n('chat.announcement')}
              </div>
            }
            key={CHAT_TABS_KEYS.notice}>
            <Announcement />
          </TabPane>
        )}
      </Tabs>
      {showMIniIcon && (
        <div className="fcr-hx-mini-icon">
          <img
            src={minimize}
            onClick={() => {
              // 最小化聊天
              hideChatModal();
            }}
          />
        </div>
      )}
    </div>
  );
};

const MemberCount = () => {
  const { memberCount } = useShallowEqualSelector((state) => {
    // 主房间内包含所有用户
    const roomUsers = state.room.roomUsers || []
    const roomUsersInfo = state.room.roomUsersInfo || []
    // 当前用户所在分组
    const currGroupUuids = state.propsData.chatGroupUuids || []
    console.log(">>>>>>>>>>>>>>>>>>>>currGroupUuids", currGroupUuids)

    // 通过当前用户所在分组， 过滤出相同分组的用户
    const members = roomUsers.filter(id => {
      const user = roomUsersInfo[id]

      if(user){
        // 目标用户所在分组
        const {chatGroupUuids = []} = user.ext ? JSON.parse(user.ext) : {}
        console.log(">>>>>>>>>>>>>>>>>>>>chatGroupUuids", chatGroupUuids)
        for(let userGroupUuid of chatGroupUuids){
          // 当前用户所在分组包含目标用户所在分组，即表示在同一个房间
          if(currGroupUuids.indexOf(userGroupUuid) !== -1){
            return true
          }
        }
      }
      return false
    })
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>members", members)

    return {
      memberCount: members.length,
    };
  });

  const textContent =
    memberCount > 0
      ? `${transI18n('chat.members')}(${memberCount})`
      : `${transI18n('chat.members')}`;

  return <Fragment>{textContent}</Fragment>;
};
