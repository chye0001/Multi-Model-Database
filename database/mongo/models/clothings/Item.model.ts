import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";



// import type { ICategory } from "../clothings/Category.model.js";
// import { CategorySchema } from "../clothings/Category.model.js";

export interface IEmbeddedCategory {
  id: number;   // id copied from the category document
  name: string; // denormalised name for fast reads
}

const EmbeddedCategorySchema = new Schema<IEmbeddedCategory>(
  {
    id:   { type: Number, required: true }, // id reference to categories collection
    name: { type: String, required: true, trim: true },
  },
  {
    _id: false, // no ObjectId — this is not a standalone document
  }
);

export interface IImage {
  id: number;
  url: string;
}

const ImageSchema = new Schema<IImage>(
  {
    id:  { type: Number, required: true },
    url: { type: String, required: true, trim: true },
  },
  {
    _id: false, // embedded sub-document, no own ObjectId needed
  }
);




export interface IItem extends Document {
  id: number;
  name: string;
  price: number | null;
  category: IEmbeddedCategory;
  brandIds: mongoose.Types.ObjectId[];
  images: IImage[];
}

const ItemSchema = new Schema<IItem>(
  {
    id:       { type: Number, required: true, unique: true },
    name:     { type: String, required: true, trim: true },
    price:    { type: Number, default: null },
    category: { type: EmbeddedCategorySchema, required: true },
    brandIds: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
    images:   [ImageSchema],
  },
  {
    versionKey: false,
     // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
    toJSON: { transform: stripInternalIdField }
  }
);

export const Item: Model<IItem> =
  mongoose.models.Item ?? mongoose.model<IItem>("Item", ItemSchema);