import { Router, Request, Response } from 'express';
import { MovieController } from '@/controllers/movie.controller';
import { verifyToken } from '@/middlewares/auth.middleware';
import { upload } from '@/utils/multer';

export class MovieRouter {
  private router: Router;
  private movieController: MovieController;

  constructor() {
    this.movieController = new MovieController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Standalone upload endpoint for frontend dashboard
    this.router.post(
      '/upload',
      upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
      (req: Request, res: Response) => {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const uploadedFile = files?.file?.[0] || files?.image?.[0] || (req as any).file;
        if (!uploadedFile) {
          return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
        }
        return res.status(200).json({
          success: true,
          data: { url: `/uploads/${uploadedFile.filename}` },
          message: 'File berhasil diupload',
        });
      },
    );

    // Movie CRUD
    this.router.get(
      '/movies',
      this.movieController.getMovies.bind(this.movieController),
    );
    this.router.get(
      '/movies/trending',
      this.movieController.getTrending.bind(this.movieController),
    );
    this.router.get(
      '/movie/:id',
      this.movieController.getMovieById.bind(this.movieController),
    );
    this.router.post(
      '/movie/:id/view',
      this.movieController.recordView.bind(this.movieController),
    );
    // Gunakan upload.array('images', 5) jika ingin upload banyak file
    this.router.post(
      '/movie',
      verifyToken,
      upload.single('image'),
      this.movieController.createMovie.bind(this.movieController),
    );
    this.router.patch(
      '/movie/:id',
      verifyToken,
      upload.single('image'),
      this.movieController.updateMovie.bind(this.movieController),
    );
    this.router.delete(
      '/movie/:id',
      verifyToken,
      this.movieController.deleteMovie.bind(this.movieController),
    );

    // Genre endpoints
    this.router.get(
      '/genres',
      this.movieController.getGenres.bind(this.movieController),
    );
    this.router.post(
      '/genre',
      verifyToken,
      this.movieController.createGenre.bind(this.movieController),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
