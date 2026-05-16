import { Request, Response } from 'express';
import prisma from '@/prisma';
import { AuthRequest } from '@/middlewares/auth.middleware';
import { movieService } from '@/services/movie.service';

export class MovieController {
  // GET /api/movies?genre=action&sort=asc&search=batman
  async getMovies(req: Request, res: Response) {
    try {
      const { movies, meta } = await movieService.getMovies(req.query);

      return res.status(200).send({ 
        success: true, 
        data: movies, 
        meta,
        message: 'success' 
      });
    } catch (err) {
      console.error('Get movies error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data movie' });
    }
  }

  // GET /api/movie/:id
  async getMovieById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const movie = await prisma.movie.findUnique({
        where: { id: Number(id) },
        include: { genre: true },
      });

      if (!movie) {
        return res.status(404).send({ success: false, message: 'Movie tidak ditemukan' });
      }

      // Fetch related movies yang same genre nya
      let related: any[] = [];
      if (movie.genreId) {
        related = await prisma.movie.findMany({
          where: {
            genreId: movie.genreId,
            id: { not: movie.id }
          },
          take: 12,
          include: { genre: true },
          orderBy: { rating: 'desc' }
        });
      }

      return res.status(200).send({ 
        success: true, 
        data: { ...movie, related }, 
        message: 'success' 
      });
    } catch (err) {
      console.error('Get movie by id error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data movie' });
    }
  }

  // POST /api/movie
  async createMovie(req: AuthRequest | Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { title, description, genreId, rating, year, category, isNewEpisode, trailerId, imdbLink, tomatoLink, fullDescription } = req.body;

      if (!title) {
        return res.status(400).send({ success: false, message: 'Semua field wajib diisi' });
      }

      // check kalau userId tidak ada maka error 401 
      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).send({ success: false, message: 'Unauthorized' });
      }

      // Khusus superadmin, batasi maksimal 6 movie
      if (authReq.user?.role === 'superadmin') {
        const count = await prisma.movie.count({ where: { authorId: userId } });
        if (count >= 6) {
          return res.status(400).json({ success: false, message: 'Superadmin hanya boleh memiliki maksimal 6 movie. Silakan hapus movie lama jika ingin menambah baru.' });
        }
      }

      if (genreId) {
        const genre = await prisma.genre.findUnique({
          where: { id: Number(genreId) }
        });
        if (!genre) {
          return res.status(404).json({ success: false, message: 'Genre tidak ditemukan' });
        }
      }

      const imagePath = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);

      const movie = await prisma.movie.create({
        data: {
          title,
          description: description || null,
          fullDescription: fullDescription || null,
          image: imagePath,
          rating: (rating !== undefined && rating !== null) ? parseFloat(String(rating)) : null,
          year: (year !== undefined && year !== null) ? parseInt(String(year), 10) : null,
          category: category || null,
          isNewEpisode: isNewEpisode === true || isNewEpisode === 'true',
          trailerId: trailerId || null,
          imdbLink: imdbLink || null,
          tomatoLink: tomatoLink || null,
          genreId: genreId ? Number(genreId) : null,
          authorId: userId,
        },
        include: { genre: true },
      });

      return res.status(201).send({ success: true, data: movie, message: 'Movie berhasil ditambahkan' });
    } catch (err) {
      console.error('Create movie error:', err);
      return res.status(500).send({ success: false, message: 'Gagal menambahkan movie' });
    }
  }

  // PATCH /api/movie/:id
  async updateMovie(req: AuthRequest | Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const { title, description, image, genreId, rating, year, category, isNewEpisode, trailerId, imdbLink, tomatoLink, fullDescription } = req.body;

      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).send({ success: false, message: 'Unauthorized' });
      }

      // Check if movie exists
      const existing = await prisma.movie.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        return res.status(404).send({ success: false, message: 'Movie tidak ditemukan' });
      }

      // Check ownership
      if (existing.authorId !== userId && authReq.user?.role !== 'superadmin') {
        return res.status(403).send({ success: false, message: 'Anda tidak memiliki hak akses untuk mengubah movie ini' });
      }

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (fullDescription !== undefined) data.fullDescription = fullDescription;
      
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      } else if (image !== undefined) {
        data.image = image;
      }
      if (rating !== undefined) data.rating = (rating !== null) ? parseFloat(String(rating)) : null;
      if (year !== undefined) data.year = (year !== null) ? parseInt(String(year), 10) : null;
      if (category !== undefined) data.category = category;
      if (isNewEpisode !== undefined) data.isNewEpisode = isNewEpisode === true || isNewEpisode === 'true';
      if (trailerId !== undefined) data.trailerId = trailerId;
      if (imdbLink !== undefined) data.imdbLink = imdbLink;
      if (tomatoLink !== undefined) data.tomatoLink = tomatoLink;
      if (genreId !== undefined) data.genreId = (genreId !== null) ? Number(genreId) : null;

      const movie = await prisma.movie.update({
        where: { id: Number(id) },
        data,
        include: { genre: true },
      });

      return res.status(200).send({ success: true, data: movie, message: 'Movie berhasil diperbarui' });
    } catch (err) {
      console.error('Update movie error:', err);
      return res.status(500).send({ success: false, message: 'Gagal memperbarui movie' });
    }
  }

  // DELETE /api/movie/:id
  async deleteMovie(req: AuthRequest | Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).send({ success: false, message: 'Unauthorized' });
      }

      const existing = await prisma.movie.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        return res.status(404).send({ success: false, message: 'Movie tidak ditemukan' });
      }

      // Check ownership
      if (existing.authorId !== userId && authReq.user?.role !== 'superadmin') {
        return res.status(403).send({ success: false, message: 'Anda tidak memiliki hak akses untuk menghapus movie ini' });
      }

      await prisma.movie.delete({ where: { id: Number(id) } });

      return res.status(200).send({ success: true, data: null, message: 'Movie berhasil dihapus' });
    } catch (err) {
      console.error('Delete movie error:', err);
      return res.status(500).send({ success: false, message: 'Gagal menghapus movie' });
    }
  }

  // GET /api/genres — helper endpoint to list available genres
  async getGenres(req: Request, res: Response) {
    try {
      const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
      return res.status(200).send({ success: true, data: genres, message: 'success' });
    } catch (err) {
      console.error('Get genres error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil data genre' });
    }
  }

  // POST /api/genre — create a genre
  async createGenre(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).send({ success: false, message: 'Nama genre wajib diisi' });

      const genre = await prisma.genre.create({ data: { name } });
      return res.status(201).send({ success: true, data: genre, message: 'Genre berhasil ditambahkan' });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return res.status(409).send({ success: false, message: 'Genre sudah ada' });
      }
      console.error('Create genre error:', err);
      return res.status(500).send({ success: false, message: 'Gagal menambahkan genre' });
    }
  }

  // POST /api/movie/:id/view — record a view click
  async recordView(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verify movie exists
      const movie = await prisma.movie.findUnique({ where: { id: Number(id) } });
      if (!movie) {
        return res.status(404).send({ success: false, message: 'Movie tidak ditemukan' });
      }

      await prisma.movieView.create({
        data: { movieId: Number(id) }
      });

      return res.status(201).send({ success: true, message: 'View recorded' });
    } catch (err) {
      console.error('Record view error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mencatat view' });
    }
  }

  // GET /api/movies/trending — movies with 20+ views in the last 2 months
  async getTrending(req: Request, res: Response) {
    try {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      // Group views by movieId, count only views from last 2 months
      const viewCounts = await prisma.movieView.groupBy({
        by: ['movieId'],
        where: {
          viewedAt: { gte: twoMonthsAgo }
        },
        _count: { movieId: true },
        having: {
          movieId: { _count: { gte: 20 } }
        },
        orderBy: {
          _count: { movieId: 'desc' }
        }
      });

      if (viewCounts.length === 0) {
        return res.status(200).send({ success: true, data: [], message: 'Belum ada movie trending' });
      }

      // Fetch the actual movie data
      const movieIds = viewCounts.map(v => v.movieId);
      const movies = await prisma.movie.findMany({
        where: { id: { in: movieIds } },
        include: { 
          genre: true,
          author: {
            select: { role: true }
          }
        }
      });

      // Sort movies by their view count (maintain trending order)
      const viewCountMap = new Map<number, number>(viewCounts.map(v => [v.movieId, v._count.movieId]));
      const sortedMovies = movies
        .map(m => ({ ...m, viewCount: viewCountMap.get(m.id) || 0 }))
        .sort((a, b) => Number(b.viewCount) - Number(a.viewCount));

      return res.status(200).send({ success: true, data: sortedMovies, message: 'success' });
    } catch (err) {
      console.error('Get trending error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil trending movies' });
    }
  }
}
