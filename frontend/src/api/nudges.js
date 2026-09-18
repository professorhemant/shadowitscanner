import client from './client';

export const listNudges = (params) => client.get('/nudges', { params });
export const sendNudge = (data) => client.post('/nudges/send', data);
