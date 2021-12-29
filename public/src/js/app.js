const App = (() => {
  let self = {
    installation: null,
    registerModule: async (name, module) => {
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

  if (!window.Promise) {
    window.Promise = Promise;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => console.debug('Service worker registered :)'));
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    //console.log('beforeinstallprompt fired');
    event.preventDefault();
    self.installation = event;
    return false;
  });

  return self;
})();

//App.registerModule('app', App);