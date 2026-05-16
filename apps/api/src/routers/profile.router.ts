import { Router } from 'express';
import { ProfileController } from '@/controllers/profile.controller';
import { verifyToken } from '@/middlewares/auth.middleware';
import { upload } from '@/helpers/multer';

export class ProfileRouter {
  private router: Router;
  private profileController: ProfileController;

  constructor() {
    this.profileController = new ProfileController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router.get('/', verifyToken, this.profileController.getProfile.bind(this.profileController));
    this.router.patch('/', verifyToken, upload.single('avatar'), this.profileController.updateProfile.bind(this.profileController));
  }

  getRouter(): Router {
    return this.router;
  }
}
