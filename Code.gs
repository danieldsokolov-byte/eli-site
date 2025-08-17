// === КОНФИГУРАЦИЯ ===
const SHEET_ID   = 'PASTE_YOUR_SHEET_ID_HERE';  // напр. '1AbCdEfGh...'
const SHEET_NAME = 'Submissions';
const NOTIFY_EMAIL = 'eli.ivanova.accounting@example.com'; // по желание; оставете празно '' за изключване

// === ПОМОЩНИ ФУНКЦИИ ===
/**
 * Взима листа; ако липсва, го създава и добавя хедъри.
 */
function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  const headers = ['Timestamp', 'Name', 'Email', 'Phone', 'Topic', 'Message', 'Source', 'IP'];
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.join('').trim().length > 0;
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

/**
 * Запис в листа.
 */
function appendSubmission_(data, ip) {
  const sheet = getOrCreateSheet_();
  const row = [
    data.timestamp || new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.topic || '',
    data.message || '',
    data.source || 'website',
    ip || ''
  ];
  sheet.appendRow(row);
}

/**
 * Изпраща известие по имейл (по желание).
 */
function notifyByEmail_(data) {
  if (!NOTIFY_EMAIL) return;
  const subject = 'Ново запитване от сайта';
  const body =
    'Получено е ново запитване:\n\n' +
    `Име: ${data.name}\n` +
    `Имейл: ${data.email}\n` +
    `Телефон: ${data.phone}\n` +
    `Тема: ${data.topic}\n` +
    `Съобщение:\n${data.message}\n\n` +
    `Източник: ${data.source || 'website'}\n` +
    `Време: ${data.timestamp || new Date().toISOString()}\n`;
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

/**
 * Нормализира входа: предпочита FormData (e.parameter), поддържа и JSON.
 */
function parseRequest_(e) {
  let data = {};
  if (e && e.parameter && Object.keys(e.parameter).length) {
    data = {
      name: e.parameter.name,
      email: e.parameter.email,
      phone: e.parameter.phone,
      topic: e.parameter.topic,
      message: e.parameter.message,
      timestamp: e.parameter.timestamp,
      source: e.parameter.source
    };
  } else if (e && e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      // игнориране — ще падне в валидацията
    }
  }
  return data;
}

/**
 * Валидира задължителни полета.
 */
function validate_(data) {
  const errors = [];
  if (!data.name || String(data.name).trim().length < 2) errors.push('Invalid name');
  const email = String(data.email || '');
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i)) errors.push('Invalid email');
  if (!data.message || String(data.message).trim().length < 10) errors.push('Invalid message');
  return errors;
}

/**
 * Строи JSON отговор.
 */
function jsonResponse_(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusCode || 200);
  return output;
}

// === HTTP ХЕНДЛЪРИ ===
function doPost(e) {
  try {
    const data = parseRequest_(e);
    const errors = validate_(data);
    if (errors.length) {
      return jsonResponse_({ status: 'error', errors }, 400);
    }

    const ip = (e && e.context && e.context.clientIp) ? e.context.clientIp : '';
    appendSubmission_(data, ip);
    notifyByEmail_(data);

    return jsonResponse_({ status: 'ok' }, 200);
  } catch (err) {
    return jsonResponse_({ status: 'error', message: String(err) }, 500);
  }
}

function doGet(e) {
  // Прост health-check
  return jsonResponse_({ status: 'ok', message: 'Service is running' }, 200);
}


