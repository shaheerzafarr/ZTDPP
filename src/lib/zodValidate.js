/** Formik `validate` adapter for a zod schema: returns { field: message }. */
export function zodValidate(schema) {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return {};
    const errors = {};
    result.error.errors.forEach((e) => {
      const field = e.path[0];
      if (field !== undefined && !errors[field]) errors[field] = e.message;
    });
    return errors;
  };
}
