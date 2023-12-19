import { parse } from 'node-html-parser'
import { StockRecommendationProp } from '../db/post.js'

export async function getStockRecommendationsForPost(
  url: string
): Promise<StockRecommendationProp[]> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Could not parse article: [${url}]`)
  }

  const responseText = await response.text()

  let stockRecommendations: StockRecommendationProp[] = []

  parse(responseText)
    .querySelectorAll('b')
    .forEach((e) => {
      let ticker
      let publishPrice
      let priceTarget
      let timeframe
      let currentElement = e
      if (e.textContent?.includes('Ticker')) {
        ticker = trimAndConvertTicker(e.nextSibling?.text)
        if (tickerPresent(ticker, stockRecommendations)) {
          return
        }
        currentElement = e.nextElementSibling
        if (currentElement?.textContent.includes('Price')) {
          publishPrice = trimAndConvertPrice(currentElement?.nextSibling.text)
          currentElement = currentElement.nextElementSibling
          if (currentElement?.textContent.includes('Price Target')) {
            priceTarget = currentElement.nextSibling.text.trim()
            if (!priceTarget.includes('N/A')) {
              priceTarget = trimAndConvertPrice(currentElement.nextSibling.text)
            } else {
              priceTarget = undefined
            }
            currentElement = currentElement.nextElementSibling
            if (currentElement?.textContent.includes('Timeframe')) {
              timeframe = currentElement.nextSibling.text.trim()
              if (timeframe.includes('N/A')) {
                timeframe = undefined
              }
              stockRecommendations.push({
                ticker: ticker,
                publishPrice: publishPrice,
                targetPrice: priceTarget,
                targetDate: timeframe,
              })
            }
          }
        }
      }
    })

  return stockRecommendations
}

function trimAndConvertPrice(price: string): number {
  let newPrice = price.trim().split(' ')[0]
  if (newPrice.startsWith('$')) {
    newPrice = newPrice.substring(1)
  }

  return Number(newPrice)
}

function trimAndConvertTicker(ticker: string): string {
  // convert ' $OTTR | ' to 'OTTR'
  return ticker.trim().split(' ')[0].substring(1)
}

function tickerPresent(
  ticker: string,
  recommendations: StockRecommendationProp[]
): boolean {
  return recommendations.find((e) => e.ticker === ticker) !== undefined
}
