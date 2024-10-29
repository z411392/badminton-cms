import Joi from "joi"

export const capacity = Joi.number().integer().min(1).messages({
    "any.required": "必須填寫總人數",
    "number.min": "至少得收個一位吧？",
})
export const courts = Joi.number().integer().min(1).messages({
    "any.required": "必須填寫球敘面數",
    "number.min": "至少得有一面場吧？",
})
export const fee = Joi.number().integer().min(0).messages({
    "any.required": "必須填寫費用",
    "number.min": "沒有開團的人在倒貼的吧？",
})
export const reserved = Joi.number().integer().min(0).messages({
    "any.required": "必須填寫預留名額",
    "number.min": "預留名額不能是負數",
})
