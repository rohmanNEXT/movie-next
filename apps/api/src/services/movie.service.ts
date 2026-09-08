import prisma from '@/prisma';

export class MovieService {
  async getMovies(query: any) {
    const { genre, sortBy, search, category, isNewEpisode, year, authorId } = query;
    const where: any = {};

    if (genre && typeof genre === 'string') {
      where.genre = { name: { contains: genre, mode: 'insensitive' } };
    }

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (isNewEpisode === 'true') {
      where.isNewEpisode = true;
    }

    if (year && typeof year === 'string') {
      const parsedYear = parseInt(year, 10);
      if (!isNaN(parsedYear)) {
        where.year = parsedYear;
      }
    }

    if (authorId && authorId !== 'undefined' && authorId !== 'null') {
      const parsedAuthorId = parseInt(authorId as string, 10);
      if (!isNaN(parsedAuthorId)) {
        where.authorId = parsedAuthorId;
      }
    }

    if (search && typeof search === 'string') {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Logika Pengurutan (Sorting)
    const orderBy: any = {};
    if (sortBy === 'asc' || sortBy === 'desc') {
      // Jika sortBy diisi 'asc' atau 'desc', urutkan berdasarkan Judul (Title)
      // asc -> abcde ... 
      // desc -> zyx ...  
      orderBy.title = sortBy;
    } else {
      // Default: Urutkan berdasarkan film terbaru (createdAt desc)
      orderBy.createdAt = 'desc';
    }


    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.movie.count({ where });
    
    const movies = await prisma.movie.findMany({
      where,
      orderBy,
      include: { 
        genre: true,
        author: {
          select: { role: true }
        }
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      movies,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }
}

export const movieService = new MovieService();
