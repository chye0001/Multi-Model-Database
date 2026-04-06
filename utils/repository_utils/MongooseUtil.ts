export const stripInternalIdField = (doc: any, ret: any) => {
  delete ret._id;
  return ret;
};