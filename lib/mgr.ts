const MGR_API = 'https://api.moregoodreviews.com/beacon'

export interface MgrStats {
  reviewCount: number
  lastReviewDate: string | null
}

export async function getMgrStats(publicKey: string): Promise<MgrStats> {
  if (!publicKey) return { reviewCount: 0, lastReviewDate: null }

  try {
    const res = await fetch(`${MGR_API}/${publicKey}/reviews`, {
      next: { revalidate: 600 },
    })

    if (!res.ok) return { reviewCount: 0, lastReviewDate: null }

    const data = await res.json()
    const reviews: Array<{ created_at?: string }> = data.data ?? data.reviews ?? []

    const sorted = reviews
      .filter((r) => r.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())

    return {
      reviewCount: reviews.length,
      lastReviewDate: sorted[0]?.created_at ?? null,
    }
  } catch {
    return { reviewCount: 0, lastReviewDate: null }
  }
}
