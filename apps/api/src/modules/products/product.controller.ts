import { Request, Response } from 'express';
import { ProductService } from './product.service';

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    try {
      const activeOnly = req.query.all !== 'true';
      const products = await ProductService.getProducts(activeOnly);
      return res.json({ success: true, data: products });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch products';
      return res.status(500).json({ success: false, error: msg });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const { name, weightGrams, category } = req.body;
      const product = await ProductService.createProduct(name, weightGrams, category);
      return res.status(201).json({ success: true, data: product });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      return res.status(400).json({ success: false, error: msg });
    }
  }
}
