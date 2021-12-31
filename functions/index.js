const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webPush = require('web-push');
const cors = require('cors')({origin: true});
const app = require('express')();
const busboy = require('busboy');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const ServiceAccount = require('./service-account-key.json');
const VapidKeys = require('./vapid-keys.json');
const FirebaseStorageHost = 'firebasestorage.googleapis.com/v0/b/';

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccount),
  databaseURL: `https://${ServiceAccount.project_id}-default-rtdb.firebaseio.com`,
  storageBucket: `${ServiceAccount.project_id}.appspot.com`,
});

app.use(cors);

app.get('/v1/hello', async (request, response) => {
  functions.logger.info('Hello logs!', {structuredData: true});
  response.send('Hello from Firebase!');
});

app.get('/v1/posts', async (request, response) => {
  functions.logger.info('Getting posts', {structuredData: true});

  const posts = [];
  const records = await admin.database().ref('posts').once('value');
  records.forEach((record) => {
    posts.push({
      id: record.val().id,
      title: record.val().title,
      location: record.val().location,
      image: record.val().image,
    });
  });

  if (posts.length > 0) {
    response.status(200).json(posts);
  } else {
    response.status(204).json();
  }
});
app.post('/v1/posts', async (request, response) => {
  functions.logger.info('Saving new post', {structuredData: true});

  let tempFile;
  const fields = {};
  const bb = busboy({headers: request.headers});
  const upload = async (filename) => {
    const uuid = crypto.randomUUID();
    const bucket = admin.storage().bucket();
    const response = await bucket.upload(filename, {
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    return `https://${FirebaseStorageHost}${bucket.name}/o/${response[0].name}?alt=media&token=${uuid}`;
  };
  const saveAndRespond = (post) => {
    admin.database().ref('posts').push({
      id: post.id,
      title: post.title,
      location: post.location,
      image: post.image,
    }, (error) => {
      if (error) {
        response.status(500).json({
          error: error,
        });
      } else {
        response.status(201).json({
          id: post.id,
          message: 'Post created',
        });

        sendPushNotification({
          title: 'New Post',
          content: 'New Post added!',
          url: '/',
          metadata: {
            type: 'post',
            id: post.id,
          },
        });
      }
    });
  };

  bb.on('file', (name, file, info) => {
    tempFile = path.join(os.tmpdir(), info.filename);
    file.pipe(fs.createWriteStream(tempFile));
  });
  bb.on('field', (name, val, info) => {
    console.log(`Field [${name}]: value: ${val}`);
    fields[name] = val;
  });
  bb.on('error', (error) => {
    console.log('Error');
    bb.unpipe();
  });
  bb.on('finish', async () => {
    console.log('Finish');
    const uploadLink = await upload(tempFile);
    saveAndRespond({
      ...fields,
      image: uploadLink,
    });
  });
  bb.on('close', () => {
    console.log('Close');
  });

  bb.end(request.rawBody);
});

app.get('/v1/subscriptions', async (request, response) => {
  functions.logger.info('Getting subscriptions', {structuredData: true});

  const subscriptions = [];
  const records = await admin.database().ref('subscriptions').once('value');
  records.forEach((record) => {
    subscriptions.push({
      endpoint: record.val().endpoint,
      keys: {
        auth: record.val().keys.auth,
        p256dh: record.val().keys.p256dh,
      },
    });
  });

  if (records.length > 0) {
    response.status(200).json(subscriptions);
  } else {
    response.status(204).json();
  }
});
app.post('/v1/subscriptions', async (request, response) => {
  functions.logger.info('Saving new subscription', {structuredData: true});

  admin.database().ref('subscriptions').push({
    endpoint: request.body.endpoint,
    keys: {
      auth: request.body.keys.auth,
      p256dh: request.body.keys.p256dh,
    },
  }, (error) => {
    if (error) {
      response.status(500).json({
        error: error,
      });
    } else {
      response.status(201).json({
        message: 'Subscription created',
      });
    }
  });
});

const sendPushNotification = async (pushNotification) => {
  functions.logger.info('Sending notification...', {structuredData: true});

  const subscriptions =
      await admin.database().ref('subscriptions').once('value');

  webPush.setVapidDetails(
      'mailto:contact@exchangeagram.com',
      VapidKeys.public,
      VapidKeys.private);

  subscriptions.forEach((subscription) => {
    const pushConfig = {
      endpoint: subscription.val().endpoint,
      keys: {
        auth: subscription.val().keys.auth,
        p256dh: subscription.val().keys.p256dh,
      },
    };

    webPush.sendNotification(
        pushConfig,
        JSON.stringify(pushNotification),
    ).then((pushResponse) => {
      functions.logger.info(
          `Notification sent ${JSON.stringify(pushResponse)}`,
          {structuredData: true});
    });
  });
};

exports.api = functions.https.onRequest(app);
