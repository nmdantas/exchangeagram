const Feed = (() => {
  const openCreatePostModal = () => {
    createPostArea.style.display = 'block';
    /*
    if (App.installation) {
      App.installation.prompt();

      App.installation.userChoice.then(function(choiceResult) {
        console.log(choiceResult.outcome);

        if (choiceResult.outcome === 'dismissed') {
          console.log('User cancelled installation');
        } else {
          console.log('User added to home screen');
        }
      });

      App.installation = null;
    }
    */
  }

  const closeCreatePostModal = () => {
    createPostArea.style.display = 'none';
  }

  const createCard = (origin) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

    const cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.style.height = '180px';
    cardWrapper.appendChild(cardTitle);

    const cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = 'San Francisco Trip';
    cardTitle.appendChild(cardTitleTextElement);

    const cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = 'In San Francisco';

    if (origin) {
      cardSupportingText.textContent += ` (${origin})`;
    }

    cardSupportingText.style.textAlign = 'center';
    /*
    const cardSaveButton = document.createElement('button');
    cardSaveButton.textContent = 'Save';
    cardSaveButton.addEventListener('click', onSaveCard);
    cardSupportingText.appendChild(cardSaveButton);
    */
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
  }

  const onSaveCard = (event) => {
    console.debug('Saving...');

    const updateCache = async () => {
      if ('caches' in window) {
        const cache = await caches.open('user-000');
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      }
    };

    updateCache();
  };

  const shareImageButton = document.querySelector('#share-image-button');
  const createPostArea = document.querySelector('#create-post');
  const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
  const sharedMomentsArea = document.querySelector('#shared-moments');

  shareImageButton.addEventListener('click', openCreatePostModal);
  closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

  return {
    modal: {
      open: openCreatePostModal,
      close: closeCreatePostModal
    },
    card: {
      create: createCard
    },
    config: {
      url: 'https://httpbin.org/get'
    }
  };
})();

const getFromNetwork = async () => {
  const response = await fetch(Feed.config.url);
};

const getFromCache = async () => {
  if ('caches' in window) {
    const cache = await caches.open('user-000');
    cache.add('https://httpbin.org/get');
    cache.add('/src/images/sf-boat.jpg');
  }
};

fetch(Feed.config.url).then(function (res) {
  return res.json();
}).then(function (data) {
  Feed.card.create();
});

getFromCache();