import { ProductModel, IProductDocument } from '../../models/Product';

export class ProductService {
  static async getProducts(activeOnly = true): Promise<IProductDocument[]> {
    const query = activeOnly ? { isActive: true } : {};
    return ProductModel.find(query).sort({ name: 1 });
  }

  static async createProduct(name: string, weightGrams: number, category?: string) {
    const existing = await ProductModel.findOne({ name });
    if (existing) {
      throw new Error(`Product with name ${name} already exists`);
    }
    return ProductModel.create({
      name,
      weightGrams,
      category: category || 'GENERAL',
      isActive: true,
    });
  }
}
