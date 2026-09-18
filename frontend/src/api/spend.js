import client from './client';

export const getSpend = (params) => client.get('/spend', { params });
