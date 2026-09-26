import { send } from '../lib/http.js';
import { STATUS, CATEGORY, FIELDS } from '../lib/assets.js';

export default function handler(req, res) {
  send(res, 200, {
    orgName: process.env.ORG_NAME || 'IT Asset',
    ticketUrl: process.env.TICKET_URL || '',
    status: STATUS, category: CATEGORY, fields: FIELDS,
  });
}
