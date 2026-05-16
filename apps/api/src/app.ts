import express, {
  json,
  urlencoded,
  Express,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import { PORT, FE_URL } from './config';
import { SampleRouter } from './routers/sample.router';
import { AuthRouter } from './routers/auth.router';
import { MovieRouter } from './routers/movie.router';
import { WishlistRouter } from './routers/wishlist.router';
import { PaymentRouter } from './routers/payment.router';
import { ProfileRouter } from './routers/profile.router';

export default class App {
  private app: Express;

  constructor() {
    this.app = express();
    this.app.set('trust proxy', 1);
    this.app.set('json spaces', 2);
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure(): void {
    this.app.use(cors({
      origin: [FE_URL, 'http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }));
    this.app.use(json());
    this.app.use(urlencoded({ extended: true }));

    // Serve uploaded files as static
    this.app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));
  }

  private handleError(): void {
    // not found
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.includes('/api/')) {
        res.status(404).send({ success: false, message: 'Endpoint tidak ditemukan' });
      } else {
        next();
      }
    });

    // error
    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        if (req.path.includes('/api/')) {
          // Handle JSON parsing errors
          if (err instanceof SyntaxError && 'body' in err) {
            return res.status(400).send({ 
              success: false, 
              message: 'Format JSON tidak valid. Periksa penulisan (seperti koma berlebih).' 
            });
          }

          console.error('Error : ', err.stack);
          res.status(500).send({ success: false, message: err.message || 'Internal Server Error' });
        } else {
          next();
        }
      },
    );
  }

  // 'void' di sini artinya fungsi ini cuma kerja buat nyusun rute, 
  // dia nggak perlu balikin data apa-apa (nggak ada perintah 'return')
  // Kalau 'void' dihapus? Nggak apa-apa, program tetap jalan karena TypeScript bisa nebak sendiri
  private routes(): void {
    // Kita wajib pakai 'new' karena Router-router ini adalah sebuah Class (cetakan)
    // Biar bisa dipakai, kita harus buat "objek aslinya" dulu pakai perintah 'new'
    // Kalau 'new' dihapus? Program bakal ERROR ("Class constructor cannot be invoked without 'new'")
    const sampleRouter = new SampleRouter();
    const authRouter = new AuthRouter();
    const movieRouter = new MovieRouter();
    const wishlistRouter = new WishlistRouter();
    const paymentRouter = new PaymentRouter();
    const profileRouter = new ProfileRouter();

    this.app.get('/api', (req: Request, res: Response) => {
      res.send({ success: true, message: 'Movie API is running! 🎬', data: null });
    });

    this.app.use('/api/samples', sampleRouter.getRouter());
    this.app.use('/api', authRouter.getRouter());
    this.app.use('/api', movieRouter.getRouter());
    this.app.use('/api', wishlistRouter.getRouter());
    this.app.use('/api', paymentRouter.getRouter());
    this.app.use('/api/profile', profileRouter.getRouter());
  }

  // Sama seperti di atas, 'void' dipakai karena fungsi start() cuma bertugas
  // nyalain server, dia nggak perlu return / ngirim balik data apapun ke pemanggilnya 
  // Kalau nekat pakai 'return'? TypeScript bakal marah (Error) karena kita melanggar janji 'void' 
  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`  ➜  [API] Local:   http://localhost:${PORT}/`);
    });
  }
}
