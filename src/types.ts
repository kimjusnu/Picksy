export type Room = 'All' | 'Weekend' | 'Work' | 'Food' | 'Travel' | 'Dating'
export type PlayableRoom = Exclude<Room, 'All'>
export type Side = 'left' | 'right'
export type MissionId = 'daily_flip' | 'crowd_reader' | 'room_hopper' | 'streak_builder'
export type BadgeId = 'rookie' | 'trend' | 'insider' | 'legend'

export type BattleCard = {
  id: string
  room: PlayableRoom
  prompt: string
  context: string
  heat: string
  comments: string
  left: {
    label: string
    detail: string
    votes: number
  }
  right: {
    label: string
    detail: string
    votes: number
  }
}

export type RoundResult = {
  cardId: string
  room: PlayableRoom
  selectedSide: Side
  leftVotes: number
  rightVotes: number
  matched: boolean
  xpGain: number
  sparksGain: number
  playedAt: number
}

export type LeaderboardEntry = {
  name: string
  title: string
  streak: number
}

export type CommentEntry = {
  id: string
  room: PlayableRoom
  name: string
  text: string
  likes: number
}

export type MissionCopy = {
  id: MissionId
  label: string
  reward: string
  points: number
}
