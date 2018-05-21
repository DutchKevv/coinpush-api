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
let data = {};
let navigationUrl = '';

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  data = payload.data;

  let notificationTitle = data.title;
  let body = data.body;
  let tag = undefined;

  switch (data.type) {
    case 'symbol-alarm':
      notificationTitle = 'Price alarm';
      body = `${data.symbol} - ${data.target}`;
      navigationUrl = `${self.location.origin}/#/symbols?symbol=${data.symbol}`;
      tag = 'symbol-alarm';
      break;
  }

  const notificationOptions = {
    body: body,
    data: data,
    icon: '/image/corp/icon.png',
    requireInteraction: true,
    tag: tag
  };

  // show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// onclick handler
self.addEventListener('notificationclick', function (event) {

  event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
    console.log('clientUrl', windowClients);

    const client = windowClients.find(windowClient => client.url.split('/#')[0] === domain);

    if (client) {
      if ('focus' in client) {
        client.focus();
      }

      // navigate
      if (navigationUrl) {
        client.navigate(navigationUrl);
      }
    } 
    // If not, then open the target URL in a new window/tab.
    else {
      if (clients.openWindow) {
        return clients.openWindow(navigationUrl);
      }
    }
  }));

  // Android needs explicit close.
  event.notification.close();
});
