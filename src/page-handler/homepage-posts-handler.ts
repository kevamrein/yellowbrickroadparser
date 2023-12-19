import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import { PostProp, addPost, getPostForUrl } from '../db/post.js'
import { URL_PREFIX } from '../constants.js'
import { getStockRecommendationsForPost } from './post-page-handler.js'

export async function getAndPersistPosts(month: Number, day: Number) {
  const response = await fetch(URL_PREFIX)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const posts = parse(await response.text()).querySelectorAll('a[href^="/p/"]')

  const postObjects: PostProp[] = []
  posts.forEach(async (post) => {
    const href = post.getAttribute('href')
    if (!href) return
    const fullUrl = `${URL_PREFIX}${href}`
    if (await getPostForUrl(fullUrl)) {
      return
    }
    const hrefParts = href.split('-')
    let dateStart = hrefParts[hrefParts.length - 1].length === 4 ? 2 : 1
    dateStart = hrefParts.length - dateStart
    const day = hrefParts[dateStart]
    const month = hrefParts[dateStart - 1]
    const monthNumber = convertMonthAbbreviationToNumber(month)
    const year = new Date().getFullYear()

    const date = new Date(year, monthNumber, Number(day))

    const parsedPost = {
      title: post.text,
      url: `${fullUrl}`,
      publishDate: date,
      stockRecommendations: await getStockRecommendationsForPost(`${fullUrl}`),
    }

    addPost(parsedPost)
    postObjects.push(parsedPost)
  })

  postObjects.sort(
    (postA, postB) => postB.publishDate.getTime() - postA.publishDate.getTime()
  )
}

function convertMonthAbbreviationToNumber(month: string) {
  const monthLowerCase = month.toLowerCase()
  const monthString = String(monthLowerCase)
  const monthAbbreviations = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ]

  return monthAbbreviations.findIndex((monthAbv) =>
    monthString.includes(monthAbv)
  )
}
