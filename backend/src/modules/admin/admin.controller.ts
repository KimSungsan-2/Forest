import { FastifyRequest, FastifyReply } from 'fastify';
import * as adminService from './admin.service';

export async function getSummary(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await adminService.getSummary();
  return reply.send(data);
}

export async function getSubscriptions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await adminService.getSubscriptionBreakdown();
  return reply.send(data);
}

export async function getActiveUsers(
  request: FastifyRequest<{ Querystring: { days?: string } }>,
  reply: FastifyReply
) {
  const days = parseInt(request.query.days || '7', 10);
  const data = await adminService.getActiveUsers(days);
  return reply.send(data);
}

export async function getUsers(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const page = parseInt(request.query.page || '1', 10);
  const limit = parseInt(request.query.limit || '20', 10);
  const data = await adminService.getUserList(page, limit);
  return reply.send(data);
}

export async function getTokenUsage(
  request: FastifyRequest<{ Querystring: { days?: string } }>,
  reply: FastifyReply
) {
  const days = parseInt(request.query.days || '30', 10);
  const data = await adminService.getTokenUsage(days);
  return reply.send(data);
}
