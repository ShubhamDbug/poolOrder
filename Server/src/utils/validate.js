import Joi from 'joi';

export const createRequestSchema = Joi.object({
  item: Joi.string().trim().min(1).max(120).required(),
  platform: Joi.string().trim().min(1).max(60).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  expiresInMinutes: Joi.number().integer().min(5).max(240).default(60)
});

export const nearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radiusKm: Joi.number().min(0.5).max(10).default(1)
});

export const chatMessageSchema = Joi.object({
  text: Joi.string().trim().min(1).max(400).required()
});
