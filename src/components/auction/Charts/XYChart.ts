import { Token } from 'uniswap-xdai-sdk'

import * as am4charts from '@amcharts/amcharts4/charts'
import * as am4core from '@amcharts/amcharts4/core'
import am4themesSpiritedaway from '@amcharts/amcharts4/themes/spiritedaway'
import { Decimal } from 'decimal.js'

import { ChainId, getTokenDisplay } from '../../../utils'

// Recalculates very big and very small numbers by reducing their length according to rules and applying suffix/prefix.
const numberFormatter = new am4core.NumberFormatter()
numberFormatter.numberFormat = '###.00 a'
numberFormatter.smallNumberThreshold = 0
numberFormatter.bigNumberPrefixes = [
  { number: 1e3, suffix: 'K' }, // Use K only with value greater than 999.00
  { number: 1e6, suffix: 'M' }, // Million
  { number: 1e9, suffix: 'B' }, // Billion
  { number: 1e12, suffix: 'T' }, // Trillion
  { number: 1e15, suffix: 'P' }, // Quadrillion
  { number: 1e18, suffix: 'E' }, // Quintillion
  { number: 1e21, suffix: 'Z' }, // Sextillion
  { number: 1e24, suffix: 'Y' }, // Septillion
]

export interface XYChartProps {
  chartElement: HTMLElement
}
export const XYChart = (props: XYChartProps): am4charts.XYChart => {
  const { chartElement } = props

  am4core.useTheme(am4themesSpiritedaway)

  const chart = am4core.create(chartElement, am4charts.XYChart)

  chart.paddingTop = 20
  chart.marginTop = 20
  chart.paddingBottom = 0
  chart.paddingLeft = 0
  chart.paddingRight = 0
  chart.marginBottom = 0

  // Colors
  const colors = {
    green: '#28a745',
    red: '#dc3545',
    white: '#FFFFFF',
    grey: '#565A69',
    orange: '#FF6347',
    darkBlue: '#001429',
    blue: '#174172',
  }

  // Create axes
  const priceAxis = chart.xAxes.push(new am4charts.ValueAxis())
  const volumeAxis = chart.yAxes.push(new am4charts.ValueAxis())
  volumeAxis.renderer.grid.template.stroke = am4core.color(colors.white)
  volumeAxis.renderer.grid.template.strokeWidth = 0.5
  volumeAxis.renderer.grid.template.strokeOpacity = 0.5
  volumeAxis.title.fill = am4core.color(colors.white)
  volumeAxis.renderer.labels.template.fill = am4core.color(colors.white)

  priceAxis.renderer.grid.template.stroke = am4core.color(colors.white)
  priceAxis.renderer.grid.template.strokeWidth = 0.5
  priceAxis.renderer.grid.template.strokeOpacity = 0.5
  priceAxis.title.fill = am4core.color(colors.white)
  priceAxis.renderer.labels.template.fill = am4core.color(colors.white)

  volumeAxis.numberFormatter = numberFormatter
  //priceAxis.numberFormatter = numberFormatter

  priceAxis.strictMinMax = true
  priceAxis.extraMin = 0.02
  priceAxis.extraMax = 0.02

  // Create serie, green line shows the price (x axis) and size (y axis) of the bids that have been placed, both expressed in the bid token
  const bidSeries = chart.series.push(new am4charts.StepLineSeries())
  bidSeries.dataFields.valueX = 'priceNumber'
  bidSeries.dataFields.valueY = 'bidValueY'
  bidSeries.name = 'Bids'
  bidSeries.strokeWidth = 1
  bidSeries.stroke = am4core.color(colors.green)
  bidSeries.fill = bidSeries.stroke
  bidSeries.startLocation = 0.5
  bidSeries.fillOpacity = 0.1
  bidSeries.dummyData = {
    description:
      'Shows the price (x axis) and size (y axis)<br/> of the bids that have been placed,<br/> both expressed in the bid token',
  }

  // Create serie, red line, shows the minimum sell price (x axis) the auctioneer is willing to accept
  const askSeries = chart.series.push(new am4charts.LineSeries())
  askSeries.dataFields.valueX = 'priceNumber'
  askSeries.dataFields.valueY = 'askValueY'
  askSeries.name = 'Sell Suply'
  askSeries.strokeWidth = 1
  askSeries.stroke = am4core.color(colors.red)
  askSeries.fill = askSeries.stroke
  askSeries.fillOpacity = 0.1
  askSeries.dummyData = {
    description:
      'Shows sell supply of the auction<br/> based on the price and nominated<br/> in the bidding token',
  }

  // New order to be placed
  const inputSeries = chart.series.push(new am4charts.LineSeries())
  inputSeries.dataFields.valueX = 'priceNumber'
  inputSeries.dataFields.valueY = 'newOrderValueY'
  inputSeries.name = 'New orders'
  inputSeries.strokeWidth = 1
  inputSeries.stroke = am4core.color(colors.orange)
  inputSeries.fill = inputSeries.stroke
  inputSeries.fillOpacity = 0.1
  inputSeries.dummyData = {
    description:
      'Shows the new order<br/> that would be placed based<br/> on the current amount and price input',
  }

  // Dotted white line -> shows the Current price, which is the closing price of the auction if
  // no more bids are submitted or cancelled and the auction ends
  const currPriceMockVal = '4.05 DAI'

  const priceSeries = chart.series.push(new am4charts.LineSeries())
  priceSeries.dataFields.valueX = 'priceNumber'
  priceSeries.dataFields.valueY = 'clearingPriceValueY'
  priceSeries.name = 'Current price'
  priceSeries.strokeWidth = 2
  priceSeries.strokeDasharray = '3,3'
  priceSeries.stroke = am4core.color(colors.white)
  priceSeries.fill = priceSeries.stroke
  priceSeries.fillOpacity = 0.1
  priceSeries.dummyData = {
    description: `Shows the current price: <strong style="font-size:14px;">[${currPriceMockVal}]</strong> <br/>This price would be<br/> the closing price of the auction<br/> if no more bids are submitted or cancelled`,
  }

  // Add cursor
  chart.cursor = new am4charts.XYCursor()
  chart.cursor.snapToSeries = [bidSeries, askSeries]
  chart.cursor.lineX.stroke = am4core.color(colors.white)
  chart.cursor.lineX.strokeWidth = 1
  chart.cursor.lineX.strokeOpacity = 0.6
  chart.cursor.lineX.strokeDasharray = '4'

  chart.cursor.lineY.stroke = am4core.color(colors.white)
  chart.cursor.lineY.strokeWidth = 1
  chart.cursor.lineY.strokeOpacity = 0.6
  chart.cursor.lineY.strokeDasharray = '4'

  // Button configuration
  chart.zoomOutButton.background.cornerRadius(5, 5, 5, 5)
  chart.zoomOutButton.background.fill = am4core.color(colors.grey)
  chart.zoomOutButton.icon.stroke = am4core.color(colors.white)
  chart.zoomOutButton.icon.strokeWidth = 2
  chart.zoomOutButton.tooltip.text = 'Zoom out'

  // Legend
  chart.legend = new am4charts.Legend()
  chart.legend.labels.template.fill = am4core.color(colors.white)
  chart.legend.itemContainers.template.tooltipHTML =
    '<div>{dataContext.dummyData.description}</div>'
  chart.tooltip.getFillFromObject = false
  chart.tooltip.background.stroke = am4core.color(colors.blue)
  chart.tooltip.background.fill = am4core.color(colors.darkBlue)

  return chart
}

interface DrawInformation {
  chart: am4charts.XYChart
  baseToken: Token
  quoteToken: Token
  chainId: ChainId
  textAuctionCurrentPrice: string
}

const formatNumberForChartTooltip = (n: number) => {
  const d = new Decimal(n)
  const nd = d.toSignificantDigits(6)
  const digits = nd.decimalPlaces()
  const decimalFormatPart = `.${'0'.repeat(digits)}`
  return numberFormatter.format(nd.toNumber(), `###${digits > 0 ? decimalFormatPart : ''} a`)
}

export const drawInformation = (props: DrawInformation) => {
  const { baseToken, chainId, chart, quoteToken, textAuctionCurrentPrice } = props
  const baseTokenLabel = baseToken.symbol
  const quoteTokenLabel = getTokenDisplay(quoteToken, chainId)
  const market = quoteTokenLabel + '-' + baseTokenLabel

  const priceTitle = ` Price`
  const volumeTitle = ` Volume (${quoteTokenLabel})`

  const [xAxis] = chart.xAxes
  const [yAxis] = chart.yAxes

  xAxis.title.text = priceTitle
  yAxis.title.text = volumeTitle
  const renderCurrentPriceLegentText = (textToReplace: string) => {
    return textToReplace.replace(/(?<=">)[^<\\/strong>]*/, textAuctionCurrentPrice)
  }

  const {
    values: [askPricesSeries, bidPricesSeries, , priceSeries],
  } = chart.series

  priceSeries.dummyData = {
    description: renderCurrentPriceLegentText(priceSeries.dummyData.description),
  }

  askPricesSeries.adapter.add('tooltipText', (text, target) => {
    const valueX = target?.tooltipDataItem?.values?.valueX?.value ?? 0
    const valueY = target?.tooltipDataItem?.values?.valueY?.value ?? 0

    const askPrice = formatNumberForChartTooltip(valueX)
    const volume = formatNumberForChartTooltip(valueY)

    return `[bold]${market}[/]\nAsk Price: [bold] ${askPrice} [/] ${quoteTokenLabel}\nVolume: [bold] ${volume} [/] ${quoteTokenLabel}`
  })

  bidPricesSeries.adapter.add('tooltipText', (text, target) => {
    const valueX = target?.tooltipDataItem?.values?.valueX?.value ?? 0
    const valueY = target?.tooltipDataItem?.values?.valueY?.value ?? 0

    const bidPrice = formatNumberForChartTooltip(valueX)
    const volume = formatNumberForChartTooltip(valueY)

    return `[bold]${market}[/]\nBid Price: [bold] ${bidPrice} [/] ${quoteTokenLabel}\nVolume: [bold] ${volume} [/] ${quoteTokenLabel}`
  })
}
