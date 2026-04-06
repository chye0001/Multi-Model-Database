import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";



export interface ICategory extends Document {
  id: number;
  name: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    id:   { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
  },
  {
    versionKey: false,
     // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
    toJSON: { transform: stripInternalIdField }
  }
);

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);
