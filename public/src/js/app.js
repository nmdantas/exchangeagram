const App = (() => {
  /*window.addEventListener('beforeinstallprompt', function (event) {
    //console.log('beforeinstallprompt fired');
    event.preventDefault();
    self.installation = event;
    return false;
  });*/

  const notify = async (title, options) => {
    if (App.serviceWorkerEnabled) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  };

  const askForNotificationPermission = () => {
    Notification.requestPermission((result) => {
      if (result === 'granted') {
        console.debug('[Notification] Granted :)');
        notify('Notification Granted', {
          body: 'Thanks for granted permission to receive notifications :)',
          icon: '/src/images/icons/app-icon-96x96.png',
          image: '/src/images/sf-boat.jpg',
          dir: 'ltr',
          lang: 'en-US', // BCP47,
          vibrate: [100, 50, 200], // vibration, pause, vibration, pause...
          badge: '/src/images/icons/app-icon-96x96.png',
        });
      } else {
        console.debug('[Notification] Not granted :(');
      }
    });
  };

  return {
    installation: null,
    serviceWorkerEnabled: false,
    initialize() {
      App.configurePolyfills();
      App.registerServiceWorker();
      App.enableNotifications();
    },
    configurePolyfills() {
      if (!window.Promise) {
        window.Promise = Promise;
      }
    },
    registerServiceWorker() {
      if (navigator.serviceWorker) {
        App.serviceWorkerEnabled = true;
        navigator.serviceWorker.register('/sw.js').then(() => console.debug('Service worker registered :)'));
      }
    },
    enableNotifications() {
      if (window.Notification) {
        const enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

        for (let i = 0; i < enableNotificationsButtons.length; i++) {
          const button = enableNotificationsButtons[i];
          button.style.display = 'inline-block';
          button.addEventListener('click', askForNotificationPermission);
        }
      }
    },
    async registerModule(name, module) {
      console.debug(`Registering module ${name}...`);

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      registration.active.postMessage(JSON.parse(JSON.stringify({
        type: 'module',
        content: {
          name: name,
          module: module
        }
      })));
    }
  };
})();

App.initialize();

//App.registerModule('app', App);