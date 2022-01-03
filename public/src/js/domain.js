const ServiceHost = 'https://us-central1-exchangeagram-2bad3.cloudfunctions.net';
//const ServiceHost = 'http://localhost:5001/exchangeagram-2bad3/us-central1';
const DatabaseInfo = {
  name: 'exchangeagram-store',
  version: 1,
  stores: {
    posts: 'posts',
    pendingPosts: 'pending-posts'
  }
}

const Domain = {
  SyncEventType: {
    Post: 'tag-sync-new-posts'
  },
  notification: {
    Actions: {
      Confirm: 'confirm',
      Cancel: 'cancel'
    },
    Tags: {
      Confirmation: 'confirm-notification'
    },
    VapidPublicKey: 'BPn7Z3qxfUnkwZ4QNPpbqTD5wypdL4Y1_IQAgvTfInGpi10FwOVPz1WY5_IQRrWInAXCj3woiHCJTKvyx6yVXnc',
  },
  utility: {
    showSnackbar(message) {
      const snackbarContainer = document.querySelector('#confirmation-toast');
      snackbarContainer.MaterialSnackbar.showSnackbar({
        message: message
      });
    },
    base64ToByteArray(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
  
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
  
      for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
      }

      return outputArray;
    },
    formatDataUriInfo(dataUri) {
      const temp = dataUri.replace('data:', '');
      const blocks = temp.split(',');
      const mediaType = blocks[0].split(';');
      const mimeType = mediaType[0];
      const extension = mimeType.split('/')[1];
      const isBase64 = mediaType.length > 1 && mediaType[1] === 'base64';
      const data = blocks[1];

      return {
        mimeType: mimeType,
        extension: extension,
        base64: isBase64,
        data: data,
      };
    },
    dataUriToBlob(dataUri) {
      const dataUriInfo = Domain.utility.formatDataUriInfo(dataUri);
      const byteString = atob(dataUriInfo.data);
      const byteArray = new Uint8Array(byteString.length);

      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }

      return new Blob([byteArray], {type: dataUriInfo.mimeType});
    },
  },
  database: {
    ...DatabaseInfo,
    TransactionType: {
      Read: 'readonly',
      ReadWrite: 'readwrite'
    },
    instance: idb.openDB(DatabaseInfo.name, DatabaseInfo.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DatabaseInfo.stores.posts)) {
          console.debug(`[IndexedDB] Creating "${DatabaseInfo.stores.posts}" object store in IndexedDB...`);
          
          db.createObjectStore(DatabaseInfo.stores.posts, {
            keyPath: 'id',
            autoIncrement: false
          });
        } else {
          console.debug(`[IndexedDB] Object store "${DatabaseInfo.stores.posts}" already exists`);
        }

        if (!db.objectStoreNames.contains(DatabaseInfo.stores.pendingPosts)) {
          console.debug(`[IndexedDB] Creating "${DatabaseInfo.stores.pendingPosts}" object store in IndexedDB...`);
          
          db.createObjectStore(DatabaseInfo.stores.pendingPosts, {
            keyPath: 'id',
            autoIncrement: false
          });
        } else {
          console.debug(`[IndexedDB] Object store "${DatabaseInfo.stores.pendingPosts}" already exists`);
        }
      }
    }),
    async save(storeName, record) {
      const db = await Domain.database.instance;
      const tx = db.transaction(storeName, Domain.database.TransactionType.ReadWrite);
      const store = tx.objectStore(storeName);

      await store.put(record);

      await tx.done;

      console.debug(`[IndexedDB] Record saved in "${store}" store`);
    },
    async findAll(storeName) {
      const db = await Domain.database.instance;
      const tx = db.transaction(storeName, Domain.database.TransactionType.Read);
      const store = tx.objectStore(storeName);

      return store.getAll();
    },
    async deleteAll(storeName) {
      const db = await Domain.database.instance;
      const tx = db.transaction(storeName, Domain.database.TransactionType.ReadWrite);
      const store = tx.objectStore(storeName);

      store.clear();

      return tx.done;
    },
    async deleteById(storeName, id) {
      const db = await Domain.database.instance;
      const tx = db.transaction(storeName, Domain.database.TransactionType.ReadWrite);
      const store = tx.objectStore(storeName);

      store.delete(id);

      return tx.done;
    }
  },
  service: {
    posts: {
      url: `${ServiceHost}/api/v1/posts`,
      async save(post) {
        const formData = new FormData();
        formData.append('id', post.id);
        formData.append('title', post.title);
        formData.append('location', post.location);
        formData.append('picture', post.image.blob, `${post.id}.${post.image.info.extension}`);

        const response = await fetch(Domain.service.posts.url, {
          method: 'POST',
          body: formData,
        });
        const json = await response.json();
    
        if (response.ok) {
          console.debug('Post registered', json);          
          return {
            ok: true,
            data: json
          };
        } else {
          console.warn('Post not saved', json);
          return {
            ok: false,
            data: json
          };
        }
      }
    },
    subscriptions: {
      url: `${ServiceHost}/api/v1/subscriptions`,
      async save(subscription) {
        const response = await fetch(Domain.service.subscriptions.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        const json = await response.json();
    
        if (response.ok) {
          console.debug('Subscription registered', json);          
          return {
            ok: true,
            data: json
          };
        } else {
          console.warn('Subscription not saved', json);
          return {
            ok: false,
            data: json
          };
        }
      }
    }
  }
};
