"use client";
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MovieRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/list-movie/${id}`);
    }
  }, [id, router]);

  return null;
}
