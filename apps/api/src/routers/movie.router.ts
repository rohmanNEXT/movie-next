import { Router } from 'express';
import { MovieController } from '@/controllers/movie.controller';
import { verifyToken } from '@/middlewares/auth.middleware';
import { upload } from '@/helpers/multer';

export class MovieRouter {
  private router: Router;
  private movieController: MovieController;

  constructor() {
    this.movieController = new MovieController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    // Movie CRUD
    this.router.get('/movies', this.movieController.getMovies.bind(this.movieController));
    this.router.get('/movies/trending', this.movieController.getTrending.bind(this.movieController));
    this.router.get('/movie/:id', this.movieController.getMovieById.bind(this.movieController));
    this.router.post('/movie/:id/view', this.movieController.recordView.bind(this.movieController));
    // Gunakan upload.array('images', 5) jika ingin upload banyak file
    this.router.post('/movie', verifyToken, upload.single('image'), this.movieController.createMovie.bind(this.movieController));
    this.router.patch('/movie/:id', verifyToken, upload.single('image'), this.movieController.updateMovie.bind(this.movieController));
    this.router.delete('/movie/:id', verifyToken, this.movieController.deleteMovie.bind(this.movieController));

    // Genre endpoints
    this.router.get('/genres', this.movieController.getGenres.bind(this.movieController));
    this.router.post('/genre', verifyToken, this.movieController.createGenre.bind(this.movieController));
  }

  getRouter(): Router {
    return this.router;
  }
}
