const webPush = require('web-push');
const env = require('../config/env');
const logger = require('../config/logger');
const { prisma } = require('../config/database');

const DEFAULT_SUBJECT = 'mailto:support@sewafi.app';

const vapidPublicKey = String(env.WEB_PUSH_PUBLIC_KEY || '').trim();
const vapidPrivateKey = String(env.WEB_PUSH_PRIVATE_KEY || '').trim();
const vapidSubject = String(env.WEB_PUSH_SUBJECT || DEFAULT_SUBJECT).trim();
const isConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isConfigured) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  logger.warn('[web-push] VAPID keys are missing. Push delivery is disabled.');
}

const toPushPayload = (payload = {}) => ({
  title: payload.title || 'SewaFi notification',
  body: payload.body || 'You have a new update.',
  url: payload.url || '/',
  icon: payload.icon || '/android-chrome-192x192.png',
  badge: payload.badge || '/favicon-32x32.png',
  data: payload.data || {},
});

const normalizeSubscriptionInput = (input = {}) => {
  const endpoint = String(input.endpoint || '').trim();
  const p256dh = String(input?.keys?.p256dh || '').trim();
  const auth = String(input?.keys?.auth || '').trim();

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    p256dh,
    auth,
  };
};

const markFailedSubscription = async (subscriptionId, deactivate = false) => {
  return prisma.pushSubscription.update({
    where: { id: subscriptionId },
    data: {
      isActive: deactivate ? false : undefined,
      failedAt: new Date(),
      failureCount: { increment: 1 },
    },
  });
};

const markSuccessfulSubscription = async (subscriptionId) => {
  return prisma.pushSubscription.update({
    where: { id: subscriptionId },
    data: {
      isActive: true,
      lastUsedAt: new Date(),
      failedAt: null,
      failureCount: 0,
    },
  });
};

const sendPushToSubscription = async (subscriptionRow, payload) => {
  const subscription = {
    endpoint: subscriptionRow.endpoint,
    keys: {
      p256dh: subscriptionRow.p256dh,
      auth: subscriptionRow.auth,
    },
  };

  await webPush.sendNotification(subscription, JSON.stringify(toPushPayload(payload)));
};

const webPushService = {
  isEnabled: () => isConfigured,

  getPublicConfig: () => ({
    enabled: isConfigured,
    publicKey: isConfigured ? vapidPublicKey : null,
  }),

  subscribeUser: async ({ userId, subscription, userAgent = null }) => {
    const normalized = normalizeSubscriptionInput(subscription);
    if (!normalized) {
      throw new Error('Invalid push subscription payload');
    }

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: normalized.endpoint },
      update: {
        userId,
        p256dh: normalized.p256dh,
        auth: normalized.auth,
        userAgent: userAgent || undefined,
        isActive: true,
      },
      create: {
        userId,
        endpoint: normalized.endpoint,
        p256dh: normalized.p256dh,
        auth: normalized.auth,
        userAgent: userAgent || undefined,
        isActive: true,
      },
    });

    return {
      id: saved.id,
      endpoint: saved.endpoint,
      isActive: saved.isActive,
    };
  },

  unsubscribeUser: async ({ userId, endpoint }) => {
    const trimmedEndpoint = String(endpoint || '').trim();
    if (!trimmedEndpoint) {
      return { updatedCount: 0 };
    }

    const result = await prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint: trimmedEndpoint,
      },
      data: {
        isActive: false,
      },
    });

    return { updatedCount: result.count || 0 };
  },

  sendToUser: async ({ userId, payload }) => {
    if (!isConfigured) {
      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        disabled: true,
      };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        await sendPushToSubscription(subscription, payload);
        sent += 1;
        await markSuccessfulSubscription(subscription.id);
      } catch (error) {
        failed += 1;
        const statusCode = Number(error?.statusCode || error?.status || 0);
        const deactivate = statusCode === 404 || statusCode === 410;
        await markFailedSubscription(subscription.id, deactivate);
        logger.warn(`[web-push] failed for subscription ${subscription.id}: ${error.message}`);
      }
    }

    return {
      attempted: subscriptions.length,
      sent,
      failed,
      disabled: false,
    };
  },

  sendTestToUser: async ({ userId, role = 'CUSTOMER' }) => {
    const roleRouteMap = {
      CUSTOMER: '/customer/notifications',
      PROVIDER: '/provider/notifications',
      ADMIN: '/admin/notifications',
    };

    return webPushService.sendToUser({
      userId,
      payload: {
        title: 'SewaFi notifications enabled',
        body: 'You will receive important booking and service updates here.',
        url: roleRouteMap[String(role || '').toUpperCase()] || '/notifications',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
      },
    });
  },
};

module.exports = webPushService;
