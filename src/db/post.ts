import { Post, Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PostProp {
  title: string
  url: string
  publishDate: Date
  stockRecommendations: StockRecommendationProp[]
}

export interface StockRecommendationProp {
  ticker: string
  publishPrice: number
  targetPrice?: number
  targetDate?: string
}

export async function getPostForUrl(
  url: string
): Promise<PostProp | undefined> {
  const dbPost = await prisma.post
    .findFirst({
      where: {
        url: url,
      },
    })
    .finally(() => {
      prisma.$disconnect()
    })

  if (!dbPost) {
    return undefined
  }

  return convertDbPostToPostProp(dbPost)
}

export async function persistPost(post: PostProp) {
  const stockRecommendations = post.stockRecommendations.map((e) =>
    convertStockRecommendationsToDb(e)
  )

  prisma.post
    .create({
      data: {
        title: post.title,
        url: post.url,
        publishDate: post.publishDate,
        recommendations: {
          set: stockRecommendations,
        },
      },
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

function convertStockRecommendationsToDb(
  recommendation: StockRecommendationProp
): Prisma.StockRecommendationCreateInput {
  return {
    ticker: recommendation.ticker,
    publishPrice: recommendation.publishPrice,
    targetPrice: recommendation.targetPrice,
    targetDate: recommendation.targetDate,
  }
}

function convertDbPostToPostProp(dbPost: Post): PostProp {
  const stockRecommendations: StockRecommendationProp[] =
    dbPost.recommendations.map((r) => {
      return {
        ticker: r.ticker,
        publishPrice: r.publishPrice,
        targetPrice: r.targetPrice,
        targetDate: r.targetDate,
      } as StockRecommendationProp
    })

  return {
    title: dbPost.title,
    publishDate: dbPost.publishDate,
    url: dbPost.url,
    stockRecommendations: stockRecommendations,
  }
}
