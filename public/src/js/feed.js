const Feed = (() => {
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
      player.srcObject = stream;
      player.style.display = 'block';
      captureButton.style.display = 'block';
      imagePickerArea.style.display = 'none';
    } catch {
      player.style.display = 'none';
      captureButton.style.display = 'none';
      imagePickerArea.style.display = 'block';
    }
  };

  const initializeLocation = () => {
    if (!navigator.geolocation) {
      localtionButton.style.display = 'none';
      return false;
    }

    return true;
  };

  const stopVideo = () => {
    if (player.srcObject) {
      player.srcObject.getVideoTracks().forEach((track) => track.stop());
    }
  };

  const captureImageFromCamera = (event) => {
    canvas.style.display = 'block';
    player.style.display = 'none';
    captureButton.style.display = 'none';

    const context = canvas.getContext('2d');
    context.drawImage(player, 0, 0, canvas.width, player.videoHeight / (player.videoWidth / canvas.width));
    
    stopVideo();

    const dataUri = canvas.toDataURL();
    const dataUriInfo = Domain.utility.formatDataUriInfo(dataUri);
    const picture = Domain.utility.dataUriToBlob(dataUri);

    currentImage = {
      blob: picture,
      info: dataUriInfo,
    };
  };

  const captureImageFromFileInput = () => {
    const file = imagePicker.files[0];
    const extensionStarts = file.name.lastIndexOf('.');

    
    currentImage = {
      blob: file,
      info: {
        mimeType: file.type,
        extension: file.name.substring(extensionStarts + 1),
      }
    };
  };

  const getLocation = (event) => {
    if (!initializeLocation()) {
      return;
    }

    localtionButton.style.display = 'none';
    localtionLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition((position) => {
      localtionButton.style.display = 'inline';
      localtionLoader.style.display = 'none';
      currentLocation = position;
    }, (error) => {
      console.error(error);
      localtionButton.style.display = 'inline';
      localtionLoader.style.display = 'none';
      currentLocation = undefined;
    }, {
      timeout: 5000
    });
  };

  const openCreatePostModal = () => {
    createPostArea.style.transform = 'translateY(0vh)';
    
    initializeMedia();
    initializeLocation();

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
    imagePickerArea.style.display = 'none';

    canvas.style.display = 'none';
    player.style.display = 'none';

    localtionButton.style.display = 'inline';
    localtionLoader.style.display = 'none';
    
    stopVideo();
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
      image: currentImage,
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
    let data;

    if (response.status === 204) {
      data = [];
    } else {
      data = await response.json();
    }
  
    Feed.config.networkDataReceived = true;
    Feed.card.clearAll();
    Feed.card.load('Network', Feed.utility.parseServiceResponseToArray(data));
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
  const player = document.querySelector('#player');
  const canvas = document.querySelector('#canvas');
  const captureButton = document.querySelector('#capture-btn');
  const imagePicker = document.querySelector('#image-picker');
  const imagePickerArea = document.querySelector('#pick-image');
  const localtionButton = document.querySelector('#location-btn');
  const localtionLoader = document.querySelector('#location-loader');

  let currentImage = undefined;
  let currentLocation = undefined;

  shareImageButton.addEventListener('click', openCreatePostModal);
  closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
  captureButton.addEventListener('click', captureImageFromCamera);
  imagePicker.addEventListener('change', captureImageFromFileInput);
  localtionButton.addEventListener('click', getLocation);
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