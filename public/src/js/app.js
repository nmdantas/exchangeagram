const App = (() => {
  let self = {
    installation: null
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