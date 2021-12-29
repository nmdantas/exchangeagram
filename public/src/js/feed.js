const Feed = (() => {
  const openCreatePostModal = () => {
    createPostArea.style.transform = 'translateY(0vh)';
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
    createPostArea.style.transform = 'translateY(100vh)';
  }

  const clearCards = () => {
    while (sharedMomentsArea.hasChildNodes()) {
      sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
  };

  const loadCards = (origin, posts) => {
    for (let i = 0; i < posts.length; i++) {
      createCard(origin, posts[i]);
    }
  };

  const createCard = (origin, feedData) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    cardWrapper.setAttribute('data-id', feedData.id);

    const cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = `url("${feedData.image}")`;
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.style.height = '180px';
    cardWrapper.appendChild(cardTitle);

    const cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = feedData.title;
    cardTitle.appendChild(cardTitleTextElement);

    const cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = feedData.location;

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

  const onCreatePost = (event) => {
    console.debug('Creating new post...');

    event.preventDefault();

    const title = document.querySelector('#title');
    const location = document.querySelector('#location');
    const registerToSyncManager = async (post) => {
      const registration = await navigator.serviceWorker.ready;
      await Domain.database.save(Domain.database.stores.pendingPosts, post);
      await registration.sync.register(Domain.SyncEventType.Post);
      
      Domain.utility.showSnackbar('Your post was saved for syncing');
    };

    if (title.value.trim() === '' || location.value.trim() === '') {
      alert('Invalid data to create new post');
      return;
    }

    const post = {
      id: uuidv4(),
      title: title.value.trim(),
      location: location.value.trim(),
      image: 'loremipsum'
    };

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      registerToSyncManager(post);
    } else {
      registerPost(post);
    }
  };

  const registerPost = async (post) => {
    const response = await Domain.service.posts.save(post);

    if (response.ok) {
      Domain.utility.showSnackbar('Your post was saved');
      getAll();
    }
  };

  const getFromNetwork = async () => {
    const response = await fetch(Domain.service.posts.url);
  
    Feed.config.networkDataReceived = true;
    Feed.card.clearAll();
    Feed.card.load('Network', Feed.utility.parseServiceResponseToArray(await response.json()));
  };
  
  const getFromIndexedDB = async () => {
    const posts = await Domain.database.findAll(Domain.database.stores.posts);
    
    if (!Feed.config.networkDataReceived) {
      Feed.card.clearAll();
      Feed.card.load('IndexedDB', posts);
    }
  };
  
  const getFromCache = async () => {
    if ('caches' in window) {
      const response = await caches.match(Domain.service.posts.url);
  
      if (response && !Feed.config.networkDataReceived) {
        Feed.card.clearAll();
        Feed.card.load('Cache', await response.json());
      }
    }
  };  

  const shareImageButton = document.querySelector('#share-image-button');
  const createPostArea = document.querySelector('#create-post');
  const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
  const sharedMomentsArea = document.querySelector('#shared-moments');
  const mainForm = document.querySelector('form');

  shareImageButton.addEventListener('click', openCreatePostModal);
  closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
  mainForm.addEventListener('submit', onCreatePost);

  return {
    utility: {
      parseServiceResponseToArray(data) {
        const posts = [];

        for (let key in data) {
          posts.push(data[key]);
        }

        return posts;
      }
    },
    modal: {
      open: openCreatePostModal,
      close: closeCreatePostModal
    },
    card: {
      load: loadCards,
      create: createCard,
      clearAll: clearCards
    },
    posts: {
      getAll() {
        getFromNetwork();
        //getFromCache();
        getFromIndexedDB();
      }
    },
    config: {
      networkDataReceived: false
    }
  };
})();

Feed.posts.getAll();