const NAME = "CODING-ENTERPRISE-NOTICE-STORAGE";

const EVENT_NAME = "CODING-ENTERPRISE-STORAGE-UPDATE";

enum NocitifacitionTypes {
  MergeRequestBean = "MergeRequestBean",
  Task = "Task",
  CommitLineNote = "CommitLineNote",
  ProjectTweet = "ProjectTweet",
  CiBuild = "CiBuild",
  TaskComment = "TaskComment",
  Requirement = "Requirement",
}

interface IMessages {
  [prop: string]: string;
}

const NotificationMessages: IMessages = {
  MergeRequestBean: "合并请求",
  Task: "任务提醒",
  CommitLineNote: "评论",
  ProjectTweet: "项目公告",
  CiBuild: "持续集成",
  TaskComment: "任务评论",
  Requirement: "需求"
}


interface INoticeDetail {
  content: string;
  created_at: number;
  id: string;
  owner_id: string;
  reminded: boolean;
  status: string;
  target_id: string;
  target_type: string;
  type: string;
};

interface INotificationData<T> {
  list: T[];
  page: number;
  pageSize: number;
  totalPage: number;
  totalRow: number;
}

interface IResponse<T> {
  code: number;
  data?: T;
  msg?: string;
}

function request(url: string, options?: RequestInit) {
  return fetch(url, options)
    .then((res) => res.json());
}

const matchUrl = /href=[\'\"]?([^\'\"]*)[\'\"]?/ig;
const matchTag = /<[^>]+>/gim;

let initialState: ICodingStorage = {
  frequency: 5,
  checked: ["MergeRequestBean", "Task", "CommitLineNote", "ProjectTweet", "CiBuild", "TaskComment", "Requirement"],
}

function throwErrNotice() {
  if (chrome && chrome.notifications) {
    chrome.notifications.create("CODING-EDTERPRISE-NOTICE-ERROR", {
      type: 'basic',
      iconUrl: 'img/icon.png',
      title: 'CODING',
      message: '扩展无法正常工作，请确保已登录 CODING 企业版账户',
    });
  }
}

if(typeof chrome.app.isInstalled!=='undefined'){
  chrome.runtime.onMessage.addListener((request: any) => {
    if (request[EVENT_NAME]) {
      initialState = request[EVENT_NAME];
      clearTimeout(timer);
      handleNotification();
    }
  });
}

let timer: number;

async function handleNotification() {
  if (initialState) {
    const { checked, frequency } = initialState;
    try {
      const response: IResponse<INotificationData<INoticeDetail>> = await request("https://codingcorp.coding.net/api/notification/unread-list?page=1&pageSize=0");
      if (response.code === 0 && response.data) {
        if (response.data.list.length !== 0) {
          const { list } = response.data;
          const checkList = list.filter((value: INoticeDetail) => checked.includes(value.target_type)).sort((a, b) => b.created_at - a.created_at);
          if (checkList.length > 0) {
            const noticeList = checkList.map((notice) => {
              const { content, target_type, id } = notice;
              const urls = [];
              let temp;
              while ((temp = matchUrl.exec(content)) != null) {
                urls.push(temp[1]);
              }

              return {
                id,
                title: NotificationMessages[target_type],
                message: content.replace(matchTag, ""),
                url: urls && urls.length >= 2 ? urls[urls.length - 1] : null,
              }
            });

            const recentNotice = noticeList[0];

            const markRead = () => {
              request(`https://codingcorp.coding.net/api/notification/mark-read`, {
                method: "POST", body: `id=${recentNotice.id}`, headers: {
                  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36"
                }
              });
            }

            const options = {
              icon: 'img/icon.png',
              body: recentNotice.message,
            };
            const notice = new Notification(recentNotice.title, options);
            if (recentNotice.url) {
              notice.onclick = () => {
                window.open(recentNotice.url!);
                markRead();
              }

              notice.onclose = () => {
                markRead();
              }
            }
          }
        }
        timer = setTimeout(() => {
          handleNotification();
          clearTimeout(timer);
        }, Number(frequency) * 60 * 1000);
      } else {
        throwErrNotice();
      }
    } catch (err) {
      throwErrNotice();
    }
  }
}

chrome.storage.sync.get(NAME, (storage: IStorage) => {
  if (storage[NAME]) {
    handleNotification();
  } else {
    chrome.storage.sync.set({ [NAME]: initialState }, () => {
      handleNotification();
    });
  }
});
