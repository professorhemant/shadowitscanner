import client from './client';

export const seedDemo = () => client.post('/demo/seed');
