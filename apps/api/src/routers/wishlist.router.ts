import { Router } from 'express';
import { WishlistController } from '@/controllers/wishlist.controller';
import { verifyToken } from '@/middlewares/auth.middleware';

export class WishlistRouter {
  private router: Router;
  private wishlistController: WishlistController;

  constructor() {
    this.wishlistController = new WishlistController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
  
    // All wishlist routes require authentication
    this.router.post('/wishlist', verifyToken, this.wishlistController.addWishlist.bind(this.wishlistController));
    this.router.get('/wishlist', verifyToken, this.wishlistController.getWishlist.bind(this.wishlistController));
    this.router.delete('/wishlist/:id', verifyToken, this.wishlistController.removeWishlist.bind(this.wishlistController));
  }

  getRouter(): Router {
    return this.router;
  }
}
