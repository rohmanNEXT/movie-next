import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { verifyToken } from '@/middlewares/auth.middleware';

export class PaymentRouter {
  private router: Router;
  private paymentController: PaymentController;

  constructor() {
    this.paymentController = new PaymentController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Menggunakan .bind() agar 'this' di dalam controller tetap merujuk pada instance controller tersebut.
    // Jika tidak pakai: 'this' menjadi undefined (error saat akses properti class).
    // Jika pakai: 'this' aman dan bisa digunakan.
    
    // Public
    this.router.get('/packages', this.paymentController.getPackages.bind(this.paymentController));

    // Protected (requires JWT)
    this.router.post('/payment/balance', verifyToken, this.paymentController.payWithBalance.bind(this.paymentController));
    this.router.post('/payment/topup', verifyToken, this.paymentController.topup.bind(this.paymentController));
    this.router.get('/payment/transactions', verifyToken, this.paymentController.getTransactions.bind(this.paymentController));
  }

  getRouter(): Router {
    return this.router;
  }
}
