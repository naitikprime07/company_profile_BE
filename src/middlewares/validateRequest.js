const Joi = require("joi");

const REQUEST_SEGMENTS = ["body", "params", "query"];

function formatJoiErrors(details) {
  return details.reduce((errors, detail) => {
    const field = detail.path.join(".") || "request";

    // Keep the first, most useful message when Joi reports multiple errors
    // for the same field.
    if (!errors[field]) errors[field] = detail.message.replace(/"/g, "");

    return errors;
  }, {});
}

function validateRequest(schemas) {
  const schemaMap = Joi.isSchema(schemas) ? { body: schemas } : schemas;

  if (!schemaMap || typeof schemaMap !== "object") {
    throw new TypeError("validateRequest requires a Joi schema or schema map");
  }

  const invalidSegment = Object.keys(schemaMap).find(
    (segment) => !REQUEST_SEGMENTS.includes(segment),
  );
  if (invalidSegment) {
    throw new TypeError(`Unsupported request segment: ${invalidSegment}`);
  }

  for (const [segment, schema] of Object.entries(schemaMap)) {
    if (!Joi.isSchema(schema)) {
      throw new TypeError(`${segment} must be a Joi schema`);
    }
  }

  return function joiValidationMiddleware(req, res, next) {
    const validated = {};
    const details = [];

    for (const [segment, schema] of Object.entries(schemaMap)) {
      const result = schema.validate(req[segment], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: false,
      });

      if (result.error) details.push(...result.error.details);
      else validated[segment] = result.value;
    }

    if (details.length) {
      return res.status(422).json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors: formatJoiErrors(details),
      });
    }

    for (const [segment, value] of Object.entries(validated)) {
      req[segment] = value;
    }

    return next();
  };
}

module.exports = validateRequest;
module.exports.formatJoiErrors = formatJoiErrors;
