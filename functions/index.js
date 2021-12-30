const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webPush = require('web-push');
const cors = require('cors')({origin: true});
const app = require('express')();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const serviceAccount = require('./service-account-key.json');
const vapidKeys = require('./vapid-keys.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://exchangeagram-2bad3-default-rtdb.firebaseio.com',
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

  admin.database().ref('posts').push({
    id: request.body.id,
    title: request.body.title,
    location: request.body.location,
    image: request.body.image,
  }, (error) => {
    if (error) {
      response.status(500).json({
        error: error,
      });
    } else {
      response.status(201).json({
        id: request.body.id,
        message: 'Post created',
      });

      sendPushNotification({
        title: 'New Post',
        content: 'New Post added!',
        url: '/',
        metadata: {
          type: 'post',
          id: request.body.id,
        },
      });
    }
  });
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
      vapidKeys.public,
      vapidKeys.private);

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
