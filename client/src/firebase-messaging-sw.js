// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': '484918912130'
});

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
const origin = self.location.origin;
let data = {};
let navigationUrl = '';

messaging.setf

messaging.setBackgroundMessageHandler(function (payload) {
  console.info('[firebase-messaging-sw.js] Received background message ', payload);

  data = payload.data;

  navigationUrl = '';
  let notificationTitle = data.title;
  let body = data.body;
  let tag = undefined;

  // switch (data.type) {
  //   case 'symbol-alarm':
  //     notificationTitle = 'Price alarm';
  //     body = `${data.symbol} - ${data.target}`;
  //     navigationUrl = `${self.location.origin}/#/symbols?symbol=${data.symbol}`;
  //     tag = 'symbol-alarm';
  //     break;
  //   case 'post-like':
  //     navigationUrl = `${self.location.origin}/#/comment/${data.parentId || data.commentId}`;
  //     body = data.content;
  //     tag = 'post-like';
  //     break;
  //   case 'comment-like':
  //     navigationUrl = `${self.location.origin}/#/comment/${data.parentId || data.commentId}`;
  //     body = data.content;
  //     tag = 'comment-like';
  //     break;
  //   case 'new-wall-post':
  //     navigationUrl = `${self.location.origin}/#/comment/${data.parentId || data.commentId}`;
  //     body = data.content;
  //     break;
  //   case 'post-comment':
  //     navigationUrl = `${self.location.origin}/#/comment/${data.parentId || data.commentId}`;
  //     break;
  //   case 'user-follow':
  //     navigationUrl = `${self.location.origin}/#/user/${data.fromUser._id}`;
  //     break;
  // }

  const notificationOptions = {
    body: body,
    data: data,
    icon: '/image/corp/icon.png',
    sound: '/assets/sound/cow.mp3',
    requireInteraction: data.type === 'symbol-alarm',
    tag: tag
  };

  // show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// onclick handler
self.addEventListener('notificationclick', function (event) {

  event.waitUntil(clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
    .then(clientList => {

      const client = clientList.find(client => client.url.split('/#')[0] === origin);

      new Promise((resolve, reject) => {
        console.log(client)
        if (client) {
          if ('focus' in client) {
            client.focus();
          }
          resolve(client);
        }
        // If not, then open the target URL in a new window/tab.
        else if (clients.openWindow) {
          clients.openWindow('/').then(resolve);
        }
        else {
          resolve();
        }
      })
        .then(client => postMessage(client, event.notification.data))

        // Android needs explicit close
        .then(() => event.notification.close());
    }));
});

function postMessage(client, message) {
  const messageChannel = new MessageChannel();
  client.postMessage(message, [messageChannel.port2]);
}

self.addEventListener('push', function (event) {
  console.log('Push Received', event); // this shows up
  let data;

  try {
    data = event.data.json().data;;
  } catch (error) {
    data = event.data.text();
  }

  let notificationTitle = data.title || '';
  let tag = undefined;

  const notificationOptions = {
    body: data.body,
    data: data,
    icon: '/image/corp/icon.png',
    sound: '/assets/sound/cow.mp3',
    requireInteraction: data.type === 'symbol-alarm',
    tag: tag
  };

  // show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
