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
    }
  },
  utility: {
    showSnackbar(message) {
      const snackbarContainer = document.querySelector('#confirmation-toast');
      snackbarContainer.MaterialSnackbar.showSnackbar({
        message: message
      });
    }
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
      url: 'https://exchangeagram-2bad3-default-rtdb.firebaseio.com/posts.json',
      async save(post) {
        const response = await fetch(Domain.service.posts.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(post)
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
    }
  }
};