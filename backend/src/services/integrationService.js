const fetch = require('node-fetch');

const jsonHeaders = { 'Content-Type': 'application/json' };

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function maximoConfigured() {
  return configured(process.env.MAXIMO_BASE_URL) &&
    (configured(process.env.MAXIMO_API_KEY) || (configured(process.env.MAXIMO_USER) && configured(process.env.MAXIMO_PASSWORD)));
}

function sapPmConfigured() {
  return configured(process.env.SAP_PM_BASE_URL) && configured(process.env.SAP_PM_API_KEY);
}

function procurementConfigured() {
  return configured(process.env.PROCUREMENT_API_URL);
}

function oneSignalConfigured() {
  return configured(process.env.ONESIGNAL_APP_ID) && configured(process.env.ONESIGNAL_API_KEY);
}

function firebaseConfigured() {
  return configured(process.env.FIREBASE_SERVER_KEY);
}

function compactError(error) {
  return error?.message || String(error);
}

async function recordIntegrationEvent(pool, integrationType, provider, operation, requestPayload, responsePayload, status, error) {
  try {
    const result = await pool.query(
      `INSERT INTO integration_events
       (integration_type, provider, operation, request_payload, response_payload, status, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        integrationType,
        provider,
        operation,
        JSON.stringify(requestPayload || {}),
        JSON.stringify(responsePayload || {}),
        status,
        error || null,
      ]
    );
    return result.rows[0];
  } catch (_) {
    return null;
  }
}

function providerStatus() {
  return {
    cmms: {
      maximo: maximoConfigured(),
      sap_pm: sapPmConfigured(),
      available: maximoConfigured() || sapPmConfigured(),
      missing: {
        maximo: ['MAXIMO_BASE_URL', 'MAXIMO_API_KEY'].filter((key) => !process.env[key]),
        sap_pm: ['SAP_PM_BASE_URL', 'SAP_PM_API_KEY'].filter((key) => !process.env[key]),
      },
    },
    procurement: {
      generic_http: procurementConfigured(),
      available: procurementConfigured(),
      missing: ['PROCUREMENT_API_URL'].filter((key) => !process.env[key]),
    },
    push: {
      onesignal: oneSignalConfigured(),
      firebase: firebaseConfigured(),
      available: oneSignalConfigured() || firebaseConfigured(),
      missing: {
        onesignal: ['ONESIGNAL_APP_ID', 'ONESIGNAL_API_KEY'].filter((key) => !process.env[key]),
        firebase: ['FIREBASE_SERVER_KEY'].filter((key) => !process.env[key]),
      },
    },
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text.slice(0, 4000) };
  }
}

async function postJson(url, body, headers) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...jsonHeaders, ...(headers || {}) },
    body: JSON.stringify(body),
  });
  const data = await readJsonResponse(response);
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.response = data;
    throw err;
  }
  return data;
}

function workOrderToMaximoPayload(workOrder) {
  return {
    wonum: `LOCAL-${workOrder.id}`,
    description: workOrder.description || workOrder.title,
    worktype: workOrder.priority === 'critical' ? 'EM' : 'PM',
    status: workOrder.status === 'open' ? 'WSCH' : 'INPRG',
    assetnum: workOrder.equipment_id ? String(workOrder.equipment_id) : undefined,
    targstartdate: workOrder.due_date || workOrder.created_at,
    priority: workOrder.priority,
    estimated_hours: workOrder.estimated_hours,
  };
}

function workOrderToSapPayload(workOrder) {
  return {
    OrderNumber: `LOCAL-${workOrder.id}`,
    ShortText: workOrder.description || workOrder.title,
    OrderType: 'PM01',
    SystemStatus: workOrder.status,
    FunctionalLocation: workOrder.equipment_id ? String(workOrder.equipment_id) : undefined,
    BasicStartDate: workOrder.due_date || workOrder.created_at,
    Priority: workOrder.priority,
    EstimatedHours: workOrder.estimated_hours,
  };
}

async function sendMaximoWorkOrder(workOrder) {
  if (!maximoConfigured()) {
    const err = new Error('IBM Maximo is not configured');
    err.status = 503;
    throw err;
  }
  const payload = workOrderToMaximoPayload(workOrder);
  const endpoint = process.env.MAXIMO_WORK_ORDER_ENDPOINT || `${process.env.MAXIMO_BASE_URL.replace(/\/$/, '')}/oslc/os/mxwo`;
  const headers = {};
  if (process.env.MAXIMO_API_KEY) {
    headers.apikey = process.env.MAXIMO_API_KEY;
  } else {
    const token = Buffer.from(`${process.env.MAXIMO_USER}:${process.env.MAXIMO_PASSWORD}`).toString('base64');
    headers.Authorization = `Basic ${token}`;
  }
  const response = await postJson(endpoint, payload, headers);
  return { provider: 'maximo', payload, response };
}

async function sendSapPmWorkOrder(workOrder) {
  if (!sapPmConfigured()) {
    const err = new Error('SAP PM is not configured');
    err.status = 503;
    throw err;
  }
  const payload = workOrderToSapPayload(workOrder);
  const endpoint = process.env.SAP_PM_WORK_ORDER_ENDPOINT || `${process.env.SAP_PM_BASE_URL.replace(/\/$/, '')}/maintenance-orders`;
  const response = await postJson(endpoint, payload, { Authorization: `Bearer ${process.env.SAP_PM_API_KEY}` });
  return { provider: 'sap_pm', payload, response };
}

async function sendWorkOrderToCmms(workOrder, provider) {
  if (provider === 'maximo') return sendMaximoWorkOrder(workOrder);
  if (provider === 'sap_pm') return sendSapPmWorkOrder(workOrder);
  if (maximoConfigured()) return sendMaximoWorkOrder(workOrder);
  return sendSapPmWorkOrder(workOrder);
}

async function dispatchProcurementOrder(order) {
  if (!procurementConfigured()) {
    const err = new Error('Procurement endpoint is not configured');
    err.status = 503;
    throw err;
  }
  const payload = {
    local_order_id: order.id,
    spare_part_id: order.spare_part_id,
    supplier: order.supplier,
    quantity: order.quantity,
    estimated_cost: order.estimated_cost,
    recommendation_id: order.recommendation_id,
  };
  const headers = process.env.PROCUREMENT_API_KEY
    ? { Authorization: `Bearer ${process.env.PROCUREMENT_API_KEY}` }
    : {};
  const response = await postJson(process.env.PROCUREMENT_API_URL, payload, headers);
  return {
    provider: 'generic_http',
    payload,
    response,
    externalOrderId: response.order_id || response.id || response.external_order_id || null,
  };
}

async function sendPushNotification(provider, tokens, title, message, payload) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    const err = new Error('No enabled device tokens found for push notification');
    err.status = 400;
    throw err;
  }
  if (provider === 'onesignal') {
    if (!oneSignalConfigured()) {
      const err = new Error('OneSignal is not configured');
      err.status = 503;
      throw err;
    }
    const body = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: tokens,
      headings: { en: title },
      contents: { en: message },
      data: payload || {},
    };
    const response = await postJson('https://onesignal.com/api/v1/notifications', body, {
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    });
    return { provider, payload: body, response };
  }
  if (provider === 'firebase') {
    if (!firebaseConfigured()) {
      const err = new Error('Firebase push is not configured');
      err.status = 503;
      throw err;
    }
    const body = {
      registration_ids: tokens,
      notification: { title, body: message },
      data: payload || {},
    };
    const response = await postJson('https://fcm.googleapis.com/fcm/send', body, {
      Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
    });
    return { provider, payload: body, response };
  }
  const err = new Error('provider must be onesignal or firebase');
  err.status = 400;
  throw err;
}

module.exports = {
  compactError,
  dispatchProcurementOrder,
  providerStatus,
  recordIntegrationEvent,
  sendPushNotification,
  sendWorkOrderToCmms,
  workOrderToMaximoPayload,
  workOrderToSapPayload,
};
