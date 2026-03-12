import { supabase } from './supabase'
import type { BattleCard, CommentEntry, LeaderboardEntry } from '../types'

type ContentKey = 'cards' | 'leaderboard' | 'rewards' | 'comments'

type AppContentRow = {
  content_key: ContentKey
  payload: unknown
}

export type RemoteCatalog = {
  cards: BattleCard[]
  leaderboard: LeaderboardEntry[]
  rewards: string[]
  comments: CommentEntry[]
}

export async function fetchRemoteCatalog(locale: 'ko' | 'en'): Promise<RemoteCatalog | null> {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('app_content')
    .select('content_key, payload')
    .eq('locale', locale)
    .in('content_key', ['cards', 'leaderboard', 'rewards', 'comments'])

  if (error || !data || data.length === 0) {
    return null
  }

  const rows = data as AppContentRow[]
  const cards = rows.find((row) => row.content_key === 'cards')?.payload
  const leaderboard = rows.find((row) => row.content_key === 'leaderboard')?.payload
  const rewards = rows.find((row) => row.content_key === 'rewards')?.payload
  const comments = rows.find((row) => row.content_key === 'comments')?.payload

  if (
    !Array.isArray(cards) ||
    !Array.isArray(leaderboard) ||
    !Array.isArray(rewards) ||
    !Array.isArray(comments) ||
    cards.length === 0
  ) {
    return null
  }

  return {
    cards: cards as BattleCard[],
    leaderboard: leaderboard as LeaderboardEntry[],
    rewards: rewards as string[],
    comments: comments as CommentEntry[],
  }
}
