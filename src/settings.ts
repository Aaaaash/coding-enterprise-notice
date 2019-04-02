const STORAGE = "CODING-ENTERPRISE-NOTICE-STORAGE";

window.addEventListener("load", () => {
  const spinner = document.querySelector(".coding-spinner");
  const spinnerClassName = spinner!.getAttribute("class");
  spinner!.className = spinnerClassName!;

  const noAuth = document.querySelector(".coding-noauth");
  const noAuthClassName = noAuth!.getAttribute("class");

  const notice = document.querySelector(".coding-notice");
  const noticeClassName = notice!.getAttribute("class");
  try {
    fetch("https://codingcorp.coding.net/api/current_user")
      .then((res) => res.json())
      .then((response) => {
        if (response.code === 0) {
          const { data } = response;
          spinner!.className = spinnerClassName + " hidden";
          notice!.className = noticeClassName + " show";
          authInfomationUpdator(data);
          bindSettingsEvent();
          bindAuthEvent(data.global_key);
          chrome.storage.sync.get(STORAGE, (storage: IStorage) => {
            if (storage[STORAGE]) {
              fetchUnreadNotification(storage[STORAGE]);
            }
          });
        }
      })
  } catch (err) {
    spinner!.className = spinnerClassName + " hidden";
    noAuth!.className = noAuthClassName + " show";
  }
});

function bindAuthEvent(globalKey: string) {
  const auth = document.querySelector(".auth");
  auth!.addEventListener("click", () => {
    window.open(`https://codingcorp.coding.net/u/${globalKey}`);
  });
}

function bindSettingsEvent() {
  const settingsContainer = document.querySelector(".coding-settings");

  settingsContainer!.addEventListener("click", () => {
    window.open("https://codingcorp.coding.net/user/account/setting/notification");
  });
}

function bindMoreEvent() {
  const more = document.querySelector(".more");
  more!.className += " show-block";

  more!.addEventListener("click", () => {
    window.open("https://codingcorp.coding.net/user/notifications/unread");
  });
}

interface IAuthInfo {
  avatar: string;
  global_key: string;
  [prop: string]: any;
}

function authInfomationUpdator(authInfo: IAuthInfo) {
  const { avatar, name } = authInfo;
  const avatarContainer = document.querySelector(".auth-avatar");
  const globalKeyContainer = document.querySelector(".auth-name");

  avatarContainer!.setAttribute("src", avatar);
  globalKeyContainer!.innerHTML = name;
}

function handleMarkRead(id: string, url?: string | null) {
  if (url) {
    window.open(url);
  }
  fetch(`https://codingcorp.coding.net/api/notification/mark-read`, {
    method: "POST", body: `id=${id}`, headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36"
    }
  });
}

const match_url = /href=[\'\"]?([^\'\"]*)[\'\"]?/ig;

function fetchUnreadNotification(storage: ICodingStorage) {
  const { checked } = storage;
  fetch("https://codingcorp.coding.net/api/notification/unread-list?page=1&pageSize=10&totalPage=215&totalRow=2146")
    .then((res) => res.json())
    .then((response) => {
      if (response.data) {
        const { list } = response.data;
        const checkList = list.filter((value: INoticeDetail) => checked.includes(value.target_type)).sort((a: INoticeDetail, b: INoticeDetail) => b.created_at - a.created_at);
        if (checkList.length > 0) {
          const noticeElementList = checkList.map((notice: INoticeDetail) => {
            const { content } = notice;
            const item = document.createElement("p");
            item.className = "notice-item";

            const contentEle = document.createElement("span");
            contentEle.innerHTML = content;
            contentEle.className = "notice-content";
            contentEle.setAttribute("title", content);

            item.appendChild(contentEle);
            const urls: string[] = [];
            let temp;
            while ((temp = match_url.exec(content)) != null) {
              urls.push(temp[1]);
            }
            item.addEventListener("click", () => handleMarkRead(notice.id, urls && urls.length >= 2 ? urls[urls.length - 1] : null));
            return item;
          });

          const listContainer = document.querySelector(".notice-list");
          for (const item of noticeElementList) {
            listContainer!.appendChild(item);
          }

          bindMoreEvent();
        } else {
          const none = document.querySelector(".none");
          none!.className += " show-block";
        }
      }
    });
}
