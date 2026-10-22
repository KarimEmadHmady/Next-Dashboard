import Joi from 'joi';

const validStatuses = [
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

export const listOrdersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string()
      .trim()
      .custom((value) => value.replace(/^wc-/, '').toLowerCase())
      .valid(...validStatuses)
      .optional(),
    search: Joi.string().trim().max(100).optional(),
    orderby: Joi.string().valid('date', 'total', 'id').default('date'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    storeId: Joi.string().uuid().optional(),
    areaId: Joi.string().uuid().optional(),
  }),
};

export const orderIdParamSchema = {
  params: Joi.object({
    id: Joi.string().trim().required(),
  }),
};
