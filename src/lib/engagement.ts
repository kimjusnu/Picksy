import type { BattleCard } from '../types'

export type HotTopicKind = 'votes' | 'thinking' | 'landslide'

export type HotTopic = {
  kind: HotTopicKind
  card: BattleCard
  roomIndex: number
  metricValue: number
}

function parseCompactCount(value: string) {
  const normalized = value.toLowerCase()
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*k/)

  if (match) {
    return Math.round(Number(match[1]) * 1000)
  }

  const digits = normalized.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function calculateEstimatedVotes(card: BattleCard) {
  const discussion = parseCompactCount(card.comments)
  return discussion * 4 + card.left.votes * 20 + card.right.votes * 20
}

function calculateThinkTime(card: BattleCard) {
  const closeness = 100 - Math.abs(card.left.votes - card.right.votes)
  const discussion = parseCompactCount(card.comments)
  return Number((4.8 + closeness * 0.045 + Math.min(3.6, discussion / 12000)).toFixed(1))
}

function calculateLandslide(card: BattleCard) {
  return Math.abs(card.left.votes - card.right.votes)
}

export function getHotTopics(cards: BattleCard[]) {
  return cards.reduce<HotTopic[]>((topics, card, roomIndex) => {
    const voteLeader = topics.find((item) => item.kind === 'votes')
    const thinkingLeader = topics.find((item) => item.kind === 'thinking')
    const landslideLeader = topics.find((item) => item.kind === 'landslide')

    const nextVoteValue = calculateEstimatedVotes(card)
    const nextThinkValue = calculateThinkTime(card)
    const nextLandslideValue = calculateLandslide(card)

    const nextTopics = topics.filter(
      (item) => item.kind !== 'votes' && item.kind !== 'thinking' && item.kind !== 'landslide',
    )

    nextTopics.push(
      voteLeader && voteLeader.metricValue >= nextVoteValue
        ? voteLeader
        : { kind: 'votes', card, roomIndex, metricValue: nextVoteValue },
    )

    nextTopics.push(
      thinkingLeader && thinkingLeader.metricValue >= nextThinkValue
        ? thinkingLeader
        : { kind: 'thinking', card, roomIndex, metricValue: nextThinkValue },
    )

    nextTopics.push(
      landslideLeader && landslideLeader.metricValue >= nextLandslideValue
        ? landslideLeader
        : { kind: 'landslide', card, roomIndex, metricValue: nextLandslideValue },
    )

    return nextTopics
  }, [])
}

export function getEstimatedVotes(card: BattleCard): number {
  return calculateEstimatedVotes(card)
}

export function getEstimatedThinkTime(card: BattleCard): number {
  return calculateThinkTime(card)
}

export function getVoteSpread(card: BattleCard): number {
  return calculateLandslide(card)
}
