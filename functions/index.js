const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

admin.initializeApp();

const expo = new Expo();

const buildNotificationMessage = (conversation, message, senderType) => {
  const snippet = message?.text || 'Vous avez reçu un nouveau message.';
  if (senderType === 'client') {
    return {
      title: conversation.providerName || 'Nouveau message client',
      body: snippet,
    };
  }
  return {
    title: conversation.clientName || 'Nouveau message prestataire',
    body: snippet,
  };
};

exports.notifyOnMessage = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    if (!message) {
      functions.logger.info('Message snapshot empty.');
      return;
    }

    const conversationRef = admin.firestore().doc(`conversations/${context.params.conversationId}`);
    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) {
      functions.logger.warn('Conversation missing for message', context.params);
      return;
    }
    const conversation = conversationSnap.data() || {};
    const senderType = message.senderType === 'provider' ? 'provider' : 'client';

    let targetContactId = conversation.clientContactId;
    if (senderType === 'client') {
      targetContactId = conversation.providerId;
    }

    if (!targetContactId) {
      functions.logger.warn('No target contact for message', context.params);
      return;
    }

    const targetDoc = await admin.firestore().collection('contacts').doc(targetContactId).get();
    if (!targetDoc.exists) {
      functions.logger.warn('Target contact doc missing', targetContactId);
      return;
    }
    const token = targetDoc.data().expoPushToken;
    if (!token) {
      functions.logger.info('No expoPushToken stored for contact', targetContactId);
      return;
    }
    if (!Expo.isExpoPushToken(token)) {
      functions.logger.warn('Invalid Expo push token', token);
      return;
    }

    const messageContent = buildNotificationMessage(conversation, message, senderType);
    const notifications = [
      {
        to: token,
        sound: 'default',
        title: messageContent.title,
        body: messageContent.body,
        data: {
          conversationId: context.params.conversationId,
        },
      },
    ];

    const chunks = expo.chunkPushNotifications(notifications);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        functions.logger.error('Failed to send push chunk', error);
      }
    }
  });
