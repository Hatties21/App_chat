import Joi from 'joi';
import { AppError } from './errorHandler.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }
    
    next();
  };
};

// Validation schemas
export const authSchemas = {
  signUp: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required()
      .messages({
        'string.alphanum': 'Username chỉ chứa chữ và số',
        'string.min': 'Username phải có ít nhất 3 ký tự',
        'string.max': 'Username không quá 30 ký tự',
        'any.required': 'Username là bắt buộc',
      }),
    password: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc',
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc',
      }),
    displayName: Joi.string().min(1).max(50).required()
      .messages({
        'string.min': 'Tên hiển thị không được để trống',
        'string.max': 'Tên hiển thị không quá 50 ký tự',
        'any.required': 'Tên hiển thị là bắt buộc',
      }),
  }),

  signIn: Joi.object({
    username: Joi.string().required()
      .messages({ 'any.required': 'Username là bắt buộc' }),
    password: Joi.string().required()
      .messages({ 'any.required': 'Mật khẩu là bắt buộc' }),
  }),
};

export const messageSchemas = {
  send: Joi.object({
    conversationID: Joi.string().hex().length(24).required()
      .messages({ 'any.required': 'ID hội thoại là bắt buộc' }),
    type: Joi.string().valid('text', 'image', 'video', 'file').default('text'),
    text: Joi.string().max(5000).allow(''),
    attachments: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        mime: Joi.string(),
        size: Joi.number(),
        name: Joi.string(),
      })
    ),
    clientMsgId: Joi.string(),
  }),
};

export const conversationSchemas = {
  direct: Joi.object({
    toUserId: Joi.string().hex().length(24).required()
      .messages({ 'any.required': 'ID người nhận là bắt buộc' }),
  }),

  createGroup: Joi.object({
    groupname: Joi.string().min(1).max(100).required()
      .messages({ 'any.required': 'Tên nhóm là bắt buộc' }),
    avatarUrl: Joi.string().uri().allow(''),
    memberIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
      .messages({ 'any.required': 'Danh sách thành viên là bắt buộc' }),
  }),
};

export const userSchemas = {
  updateProfile: Joi.object({
    displayName: Joi.string().min(1).max(50)
      .messages({
        'string.min': 'Tên hiển thị không được để trống',
        'string.max': 'Tên hiển thị không quá 50 ký tự',
      }),
    bio: Joi.string().max(500).allow('')
      .messages({
        'string.max': 'Giới thiệu không quá 500 ký tự',
      }),
    phone: Joi.string().max(20).allow('', null)
      .messages({
        'string.max': 'Số điện thoại không hợp lệ',
      }),
    avatarUrl: Joi.string().uri().allow('', null)
      .messages({
        'string.uri': 'URL avatar không hợp lệ',
      }),
  }),
};
