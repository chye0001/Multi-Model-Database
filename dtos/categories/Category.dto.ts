export type EmbeddedCategory = {
  categoryId: number;
  name: string;
}

export type Category = {
  id: number;
  name: string;
  fromDatabase?: string;
};
