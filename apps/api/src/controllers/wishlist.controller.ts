import { Response } from 'express';
import prisma from '@/prisma';
import { AuthRequest } from '@/middlewares/auth.middleware';

export class WishlistController {
  // POST /api/wishlist
  async addWishlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { movieId } = req.body;

      if (!movieId) {
        return res.status(400).send({ success: false, message: 'movieId wajib diisi' });
      }

      // Check movie exists
      const movie = await prisma.movie.findUnique({ where: { id: Number(movieId) } });
      if (!movie) {
        return res.status(404).send({ success: false, message: 'Movie tidak ditemukan' });
      }

      // Check duplicate
      const existing = await prisma.wishlist.findUnique({
        where: { userId_movieId: { userId, movieId: Number(movieId) } },
      });
      if (existing) {
        return res.status(409).send({ success: false, message: 'Movie sudah ada di wishlist' });
      }

      const wishlist = await prisma.wishlist.create({
        data: { userId, movieId: Number(movieId) },
        include: { movie: { include: { genre: true } } },
      });

      return res.status(201).send({ success: true, data: wishlist, message: 'Berhasil ditambahkan ke wishlist' });
    } catch (err) {
      console.error('Add wishlist error:', err);
      return res.status(500).send({ success: false, message: 'Gagal menambahkan ke wishlist' });
    }
  }

  // GET /api/wishlist
  async getWishlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const wishlists = await prisma.wishlist.findMany({
        where: { userId },
        include: { movie: { include: { genre: true } } },
        orderBy: { id: 'desc' },
      });

      return res.status(200).send({ success: true, data: wishlists, message: 'success' });
    } catch (err) {
      console.error('Get wishlist error:', err);
      return res.status(500).send({ success: false, message: 'Gagal mengambil wishlist' });
    }
  }

  // DELETE /api/wishlist/:movieId
  async removeWishlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id: movieId } = req.params;

      const wishlist = await prisma.wishlist.findFirst({
        where: { movieId: Number(movieId), userId },
      });

      if (!wishlist) {
        return res.status(404).send({ success: false, message: 'Wishlist tidak ditemukan' });
      }

      await prisma.wishlist.delete({ where: { id: wishlist.id } });

      return res.status(200).send({ success: true, data: null, message: 'Berhasil dihapus dari wishlist' });
    } catch (err) {
      console.error('Remove wishlist error:', err);
      return res.status(500).send({ success: false, message: 'Gagal menghapus dari wishlist' });
    }
  }
}
