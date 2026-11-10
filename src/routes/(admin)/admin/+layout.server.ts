// src/routes/(admin)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session, role } }) => {
  if (!session || (role !== 'admin' && role !== 'instructor')) {
    throw redirect(303, '/'); // Kick them out
  }
};
