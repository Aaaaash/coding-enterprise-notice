declare var chrome: any;

const STORAGE_NAME = "CODING-ENTERPRISE-NOTICE-STORAGE";
const STORAGE_UPDATE = "CODING-ENTERPRISE-STORAGE-UPDATE";

let initialStorage: ICodingStorage = {
  frequency: 5,
  checked: ["MergeRequestBean", "Task", "CommitLineNote", "ProjectTweet", "CiBuild", "TaskComment", "Requirement"],
}

function initialize(storage: ICodingStorage) {
  const { frequency, checked } = storage;
  const frequencyEle = document.querySelector(".coding-frequency");
  (frequencyEle as HTMLInputElement).value = String(frequency);

  const checkList: Array<HTMLInputElement> = Array.from(document.querySelectorAll(".coding-checkbox"));
  for (const type of checked) {
    for (let index = 0; index < checkList.length; index += 1) {
      if (checkList[index].dataset.type === type) {
        checkList[index].checked = true;
      } 
    }
  }
}

chrome.storage.sync.get(STORAGE_NAME, (storage: IStorage) => {
  if (storage[STORAGE_NAME]) {
    initialize(storage[STORAGE_NAME]);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const homeBtn = document.querySelector(".coding-home");
  homeBtn!.addEventListener("click", (e) => {
    window.open("https://codingcorp.coding.net/");
  });

  const noticeBtn = document.querySelector(".coding-notice");
  noticeBtn!.addEventListener("click", () => {
    window.open("https://codingcorp.coding.net/user/notifications/unread");
  });

  fetch("https://codingcorp.coding.net/api/current_user")
    .then((re) => re.json())
    .then((response) => {
      if (response.code === 0) {
        const globalKey = response.global_key;
        const userBtn = document.querySelector(".coding-user");
        userBtn!.addEventListener("click", () => {
          window.open(`https://codingcorp.coding.net/u/${globalKey}`);
        });
      }
    });

  const saveBtn = document.querySelector(".coding-save");
  saveBtn!.addEventListener("click", () => {
    const checked: string[] = [];
    const checkList: Array<HTMLInputElement> = Array.from(document.querySelectorAll(".coding-checkbox"));
    for (let index = 0; index < checkList.length; index += 1) {
      if (checkList[index].checked) {
        checked.push(checkList[index].dataset.type!);
      }
    }

    const frequency = (document.querySelector(".coding-frequency") as HTMLInputElement).value;

    chrome.storage.sync.set({ [STORAGE_NAME]: { frequency, checked } as ICodingStorage }, function () {
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/icon.png',
        title: 'CODING',
        message: '保存成功'
      });
      console.log(frequency, checked);
      chrome.runtime.sendMessage({[STORAGE_UPDATE]: { frequency, checked }});
    });
  });

  const restoreBtn = document.querySelector(".coding-restore");
  restoreBtn!.addEventListener("click", () => {
    chrome.storage.sync.set({ [STORAGE_NAME]: initialStorage as ICodingStorage }, function () {
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'img/icon.png',
        title: 'CODING',
        message: '已恢复为默认值'
      });

      chrome.runtime.sendMessage({[STORAGE_UPDATE]: initialStorage});
    });
  });
});
