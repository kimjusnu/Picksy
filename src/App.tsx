
import { startTransition, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import './App.css'
import logoMark from './assets/picksy-logo.svg'
import { fetchRemoteCatalog, type RemoteCatalog } from './lib/content'
import { getEstimatedThinkTime, getEstimatedVotes, getHotTopics, getVoteSpread } from './lib/engagement'
import { getRandomNickname } from './lib/nicknames'
import { isDbConnected, supabase } from './lib/supabase'
import type { BattleCard, CommentEntry, PlayableRoom, Room, RoundResult, Side } from './types'

type Locale = 'ko' | 'en'
type ThemeName = 'citrus' | 'ocean' | 'berry'
type AppView = 'home' | 'board'
type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword'
type AuthBusy = AuthMode | 'sendVerification' | 'verifyEmail' | null
type AuthStatus = 'idle' | 'success' | 'error'

type SessionSnapshot = {
  activeRoom: Room
  streak: number
  visitedRooms: PlayableRoom[]
}

type DiscussionComment = {
  id: string
  cardId: string
  author: string
  text: string
  likes: number
  createdAt: number
}

type BoardPost = {
  card: BattleCard
  commentCount: number
  estimatedVotes: number
  thinkTime: number
  spread: number
  latestComment: DiscussionComment | null
  score: number
}

type BoardMetric = {
  room: PlayableRoom
  votes: number
  comments: number
  thinkTime: number
  strength: number
}

const SESSION_KEY = 'picksy-session-v5'
const COMMENTS_KEY = 'picksy-discussion-comments-v1'
const THEME_KEY = 'picksy-theme'
const ROOM_ORDER: PlayableRoom[] = ['Weekend', 'Work', 'Food', 'Travel', 'Dating']

const DEFAULT_SESSION: SessionSnapshot = {
  activeRoom: 'All',
  streak: 0,
  visitedRooms: [],
}

function normalizeLocale(language: string | null | undefined): Locale {
  return language?.toLowerCase().startsWith('en') ? 'en' : 'ko'
}

function readTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'citrus'
  }

  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'citrus' || stored === 'ocean' || stored === 'berry') {
    return stored
  }

  return 'citrus'
}

function readSession(): SessionSnapshot {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return DEFAULT_SESSION
    }

    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>
    return {
      activeRoom: parsed.activeRoom ?? DEFAULT_SESSION.activeRoom,
      streak: parsed.streak ?? DEFAULT_SESSION.streak,
      visitedRooms: Array.isArray(parsed.visitedRooms)
        ? parsed.visitedRooms.filter((room): room is PlayableRoom => ROOM_ORDER.includes(room as PlayableRoom))
        : [],
    }
  } catch {
    return DEFAULT_SESSION
  }
}

function readStoredDiscussionComments() {
  if (typeof window === 'undefined') {
    return [] as DiscussionComment[]
  }

  try {
    const raw = window.localStorage.getItem(COMMENTS_KEY)
    if (!raw) {
      return [] as DiscussionComment[]
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DiscussionComment[]) : []
  } catch {
    return [] as DiscussionComment[]
  }
}

function getDisplayName(session: Session | null, locale: Locale) {
  const fallback = locale === 'ko' ? '익명 Picksy' : 'Picksy member'
  return (
    session?.user?.user_metadata?.nickname ??
    session?.user?.user_metadata?.name ??
    session?.user?.email?.split('@')[0] ??
    fallback
  )
}

function formatNumber(locale: Locale, value: number) {
  return value.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')
}

function formatRelativeTime(locale: Locale, timestamp: number) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000))

  if (diffMinutes < 60) {
    return locale === 'ko' ? `${diffMinutes}분 전` : `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  return locale === 'ko' ? `${diffHours}시간 전` : `${diffHours}h ago`
}

function getSharePercent(result: RoundResult | null) {
  if (!result) {
    return 0
  }

  return result.selectedSide === 'left' ? result.leftVotes : result.rightVotes
}

function getTimestamp() {
  return Date.now()
}

function buildSeedDiscussionComments(cards: BattleCard[], comments: CommentEntry[]) {
  const cardsByRoom = ROOM_ORDER.reduce<Record<PlayableRoom, BattleCard[]>>(
    (accumulator, room) => ({
      ...accumulator,
      [room]: cards.filter((card) => card.room === room),
    }),
    {
      Weekend: [],
      Work: [],
      Food: [],
      Travel: [],
      Dating: [],
    },
  )

  const roomCounts: Record<PlayableRoom, number> = {
    Weekend: 0,
    Work: 0,
    Food: 0,
    Travel: 0,
    Dating: 0,
  }

  return comments.flatMap((comment, index) => {
    const candidates = cardsByRoom[comment.room]
    const card = candidates[roomCounts[comment.room] % Math.max(1, candidates.length)]

    roomCounts[comment.room] += 1

    if (!card) {
      return []
    }

    return [
      {
        id: `seed-${comment.id}`,
        cardId: card.id,
        author: comment.name,
        text: comment.text,
        likes: comment.likes,
        createdAt: Date.now() - (index + 1) * 1000 * 60 * 47,
      },
    ]
  })
}

export default function App() {
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage)
  const battleRef = useRef<HTMLDivElement | null>(null)
  const nicknameTouchedRef = useRef(false)
  const copyTimerRef = useRef<number | null>(null)

  const [theme, setTheme] = useState<ThemeName>(() => readTheme())
  const [view, setView] = useState<AppView>(() =>
    typeof window !== 'undefined' && window.location.hash === '#board' ? 'board' : 'home',
  )
  const [remoteCatalog, setRemoteCatalog] = useState<RemoteCatalog | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(() => !supabase)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signIn')
  const [authBusy, setAuthBusy] = useState<AuthBusy>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle')
  const [authMessage, setAuthMessage] = useState('')
  const [passwordRecoveryReady, setPasswordRecoveryReady] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authVerificationCode, setAuthVerificationCode] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('')
  const [authDisplayName, setAuthDisplayName] = useState(() => getRandomNickname(locale))
  const [authEmailVerified, setAuthEmailVerified] = useState(false)
  const [activeRoom, setActiveRoom] = useState<Room>(() => readSession().activeRoom)
  const [streak, setStreak] = useState(() => readSession().streak)
  const [visitedRooms, setVisitedRooms] = useState<PlayableRoom[]>(() => readSession().visitedRooms)
  const [currentCardId, setCurrentCardId] = useState('')
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [history, setHistory] = useState<RoundResult[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedBoardCardId, setSelectedBoardCardId] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [storedDiscussionComments, setStoredDiscussionComments] = useState<DiscussionComment[]>(() =>
    readStoredDiscussionComments(),
  )

  const localCards = useMemo(() => t('cards', { returnObjects: true }) as unknown as BattleCard[], [t])
  const localComments = useMemo(
    () => t('community.items', { returnObjects: true }) as unknown as CommentEntry[],
    [t],
  )

  const cards = remoteCatalog?.cards ?? localCards
  const reactionComments = remoteCatalog?.comments ?? localComments
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const filteredCards = useMemo(
    () => (activeRoom === 'All' ? cards : cards.filter((card) => card.room === activeRoom)),
    [activeRoom, cards],
  )
  const currentCard = useMemo(() => {
    const directMatch = currentCardId ? cardsById.get(currentCardId) : null

    if (directMatch && (activeRoom === 'All' || directMatch.room === activeRoom)) {
      return directMatch
    }

    return filteredCards[0] ?? cards[0] ?? null
  }, [activeRoom, cards, cardsById, currentCardId, filteredCards])

  const hotTopics = useMemo(() => {
    const topicOrder = ['votes', 'thinking', 'landslide'] as const
    return getHotTopics(cards).sort((left, right) => topicOrder.indexOf(left.kind) - topicOrder.indexOf(right.kind))
  }, [cards])

  const seedDiscussionComments = useMemo(
    () => buildSeedDiscussionComments(cards, reactionComments),
    [cards, reactionComments],
  )
  const discussionComments = storedDiscussionComments.length > 0 ? storedDiscussionComments : seedDiscussionComments

  const commentsByCard = useMemo(() => {
    const map = new Map<string, DiscussionComment[]>()

    discussionComments.forEach((comment) => {
      const previous = map.get(comment.cardId) ?? []
      map.set(comment.cardId, [...previous, comment].sort((left, right) => right.createdAt - left.createdAt))
    })

    return map
  }, [discussionComments])

  const boardPosts = useMemo<BoardPost[]>(() => {
    return cards
      .map((card) => {
        const thread = commentsByCard.get(card.id) ?? []
        const estimatedVotes = getEstimatedVotes(card)
        const thinkTime = getEstimatedThinkTime(card)
        const spread = getVoteSpread(card)

        return {
          card,
          commentCount: thread.length,
          estimatedVotes,
          thinkTime,
          spread,
          latestComment: thread[0] ?? null,
          score: estimatedVotes + thread.length * 820 + thinkTime * 180 + spread * 130,
        }
      })
      .sort((left, right) => right.score - left.score)
  }, [cards, commentsByCard])

  const boardMetrics = useMemo<BoardMetric[]>(() => {
    return ROOM_ORDER.map((room) => {
      const roomCards = cards.filter((card) => card.room === room)
      const votes = roomCards.reduce((total, card) => total + getEstimatedVotes(card), 0)
      const comments = discussionComments.filter((comment) => cardsById.get(comment.cardId)?.room === room).length
      const thinkTime =
        roomCards.length > 0
          ? Number((roomCards.reduce((total, card) => total + getEstimatedThinkTime(card), 0) / roomCards.length).toFixed(1))
          : 0

      return {
        room,
        votes,
        comments,
        thinkTime,
        strength: votes / 1000 + comments * 26 + thinkTime * 18,
      }
    })
  }, [cards, cardsById, discussionComments])

  const maxBoardStrength = Math.max(...boardMetrics.map((metric) => metric.strength), 1)
  const liveUsers = formatNumber(locale, 1200 + cards.length * 19 + discussionComments.length * 13 + history.length * 21)
  const avgSession = (2.8 + Math.min(2.9, boardMetrics.reduce((total, metric) => total + metric.thinkTime, 0) / 18)).toFixed(1)
  const commentRate = `${Math.min(94, 34 + Math.round(discussionComments.length / Math.max(1, cards.length) * 18))}%`

  const boardPostsFiltered = useMemo(
    () => (activeRoom === 'All' ? boardPosts : boardPosts.filter((post) => post.card.room === activeRoom)),
    [activeRoom, boardPosts],
  )

  const activeBoardCard = useMemo(() => {
    const directMatch = selectedBoardCardId ? cardsById.get(selectedBoardCardId) : null
    if (directMatch && (activeRoom === 'All' || directMatch.room === activeRoom)) {
      return directMatch
    }

    return boardPostsFiltered[0]?.card ?? currentCard ?? cards[0] ?? null
  }, [activeRoom, boardPostsFiltered, cards, cardsById, currentCard, selectedBoardCardId])

  const currentCardComments = currentCard ? (commentsByCard.get(currentCard.id) ?? []).slice(0, 3) : []
  const activeBoardComments = activeBoardCard ? commentsByCard.get(activeBoardCard.id) ?? [] : []

  const boardCopy =
    locale === 'ko'
      ? {
          liveTopicsTitle: '지금 뜨는 토픽',
          liveTopicsSubtitle: '많이 눌리고, 오래 읽히고, 가장 크게 갈리는 글만 따로 모았어요.',
          boardPreviewTitle: '토픽 보드',
          boardPreviewSubtitle: 'Blind처럼 빠르게 훑고, 게시물 단위로 깊게 들어가는 흐름을 참고해 보드형으로 정리했어요.',
          boardCta: '전체 보드 보기',
          openBoard: '보드에서 보기',
          boardPageTitle: '전체 보드',
          boardPageSubtitle: '주제별 글과 댓글을 한 번에 읽는 공간이에요.',
          boardBack: '홈으로',
          boardEmpty: '아직 댓글이 없어요. 첫 반응을 남겨 보세요.',
          trendTitle: '실시간 흐름',
          trendSubtitle: '보드별 반응 강도를 한눈에 봐요.',
          voteMetric: '예상 투표',
          commentMetric: '댓글',
          thinkMetric: '평균 고민',
          discussionTitle: '이 글에서 붙는 반응',
          discussionSubtitle: '지금 이 토픽 아래에서 이어지는 댓글입니다.',
          commentPlaceholder: '이 글에 한마디를 남겨 주세요',
          commentSubmit: '댓글 달기',
          loginToComment: '댓글을 달려면 로그인해 주세요.',
          openComments: '댓글 이어보기',
          latestChoice: '방금 선택한 결과',
          latestChoiceEmpty: '먼저 하나 골라 보면 여기서 바로 흐름을 보여줘요.',
          pollOpen: '토픽 둘러보기',
          boardNavLabel: '보드 선택',
          latestActivity: '최근 반응',
          resultsAgree: '사람들이 많이 고른 쪽과 같았어요.',
          resultsMinority: '소수 의견을 골랐어요. 댓글이 더 재밌게 읽힐 수 있어요.',
          strongestBoard: '지금 가장 센 보드',
          boardSummaryLabel: '토픽 요약',
          commentCount: (value: number) => `댓글 ${value}개`,
          estimatedVotes: (value: number) => `예상 투표 ${formatNumber(locale, value)}`,
          thinkTime: (value: number) => `평균 고민 ${value}초`,
          spread: (value: number) => `격차 ${value}%p`,
        }
      : {
          liveTopicsTitle: 'Live topics',
          liveTopicsSubtitle: 'We only surface the posts that are most clicked, most debated, and most split.',
          boardPreviewTitle: 'Topic board',
          boardPreviewSubtitle: 'Structured like a fast board feed first, then a deeper post-and-comment flow.',
          boardCta: 'Open full board',
          openBoard: 'Open in board',
          boardPageTitle: 'Full board',
          boardPageSubtitle: 'Read topic posts and comments in one place.',
          boardBack: 'Back home',
          boardEmpty: 'No comments yet. Be the first to react.',
          trendTitle: 'Live pulse',
          trendSubtitle: 'See which boards are moving right now.',
          voteMetric: 'Est. votes',
          commentMetric: 'Comments',
          thinkMetric: 'Avg. think',
          discussionTitle: 'What people are saying here',
          discussionSubtitle: 'These are the latest comments under this topic.',
          commentPlaceholder: 'Leave a short take on this topic',
          commentSubmit: 'Post comment',
          loginToComment: 'Sign in to comment.',
          openComments: 'Open comments',
          latestChoice: 'Your latest pick',
          latestChoiceEmpty: 'Pick one topic and we will show the current reaction here.',
          pollOpen: 'Explore topics',
          boardNavLabel: 'Board selector',
          latestActivity: 'Latest activity',
          resultsAgree: 'You matched the side most people picked.',
          resultsMinority: 'You picked the minority side. The comments may get more interesting.',
          strongestBoard: 'Strongest board right now',
          boardSummaryLabel: 'Topic snapshot',
          commentCount: (value: number) => `${value} comments`,
          estimatedVotes: (value: number) => `${formatNumber(locale, value)} est. votes`,
          thinkTime: (value: number) => `${value}s avg. think time`,
          spread: (value: number) => `${value} pt spread`,
        }

  const shareText = useMemo(() => {
    if (!lastResult) {
      return t('shareCard.defaultText')
    }

    const card = cardsById.get(lastResult.cardId)
    const selectedLabel = lastResult.selectedSide === 'left' ? card?.left.label : card?.right.label

    return t('shareCard.resultText', {
      label: selectedLabel ?? '',
      percent: getSharePercent(lastResult),
      streak,
    })
  }, [cardsById, lastResult, streak, t])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    document.body.classList.toggle('modalOpen', isAuthModalOpen)

    return () => {
      document.body.classList.remove('modalOpen')
    }
  }, [isAuthModalOpen])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const snapshot: SessionSnapshot = {
      activeRoom,
      streak,
      visitedRooms,
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
  }, [activeRoom, streak, visitedRooms])

  useEffect(() => {
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(storedDiscussionComments))
  }, [storedDiscussionComments])

  useEffect(() => {
    if (!isDbConnected) {
      return
    }

    let cancelled = false

    void fetchRemoteCatalog(locale)
      .then((catalog) => {
        if (!cancelled) {
          setRemoteCatalog(catalog)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteCatalog(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    if (!supabase) {
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryReady(true)
        setIsAuthModalOpen(true)
        setAuthMode('resetPassword')
        setAuthStatus('success')
        setAuthMessage(i18n.t('auth.checkEmail'))
      }

      if (event === 'SIGNED_OUT') {
        setPasswordRecoveryReady(false)
        setAuthEmailVerified(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [i18n])

  useEffect(() => {
    const handleHashChange = () => {
      setView(window.location.hash === '#board' ? 'board' : 'home')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!copied) {
      return
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false)
    }, 1800)

    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [copied])

  function setAuthFeedback(status: AuthStatus, message: string) {
    setAuthStatus(status)
    setAuthMessage(message)
  }

  function resetAuthFields(mode: AuthMode, nextLocale: Locale = locale) {
    nicknameTouchedRef.current = false
    setAuthMode(mode)
    setAuthBusy(null)
    setAuthStatus('idle')
    setAuthMessage('')
    setAuthEmail('')
    setAuthVerificationCode('')
    setAuthPassword('')
    setAuthPasswordConfirm('')
    setAuthEmailVerified(false)
    setAuthDisplayName(getRandomNickname(nextLocale))
  }

  function openAuthModal(message?: string, mode: AuthMode = 'signIn') {
    if (!supabase) {
      setAuthFeedback('error', t('auth.setupNeeded'))
      setIsAuthModalOpen(true)
      setAuthMode('signIn')
      return
    }

    setIsAuthModalOpen(true)
    resetAuthFields(mode)

    if (message) {
      setAuthFeedback('error', message)
    }
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false)
    if (authMode !== 'resetPassword') {
      setAuthStatus('idle')
      setAuthMessage('')
    }
  }

  function handleAuthModeChange(nextMode: AuthMode) {
    resetAuthFields(nextMode)
  }

  function handleOpenBoard(cardId?: string) {
    if (cardId) {
      setSelectedBoardCardId(cardId)
    }

    setView('board')
    window.location.hash = 'board'
  }

  function handleBackHome() {
    setView('home')
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}`)
  }

  function handleRoomChange(room: Room) {
    setActiveRoom(room)
    if (room !== 'All') {
      setVisitedRooms((previous) => (previous.includes(room) ? previous : [...previous, room]))
    }

    const nextCards = room === 'All' ? cards : cards.filter((card) => card.room === room)
    if (nextCards[0]) {
      setCurrentCardId(nextCards[0].id)
      setSelectedBoardCardId(nextCards[0].id)
    }
  }

  function advanceCard(cardId: string) {
    const pool = activeRoom === 'All' ? cards : filteredCards
    if (pool.length <= 1) {
      return
    }

    const currentIndex = pool.findIndex((card) => card.id === cardId)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pool.length : 0
    setCurrentCardId(pool[nextIndex].id)
  }

  function handleVote(side: Side) {
    if (!currentCard) {
      return
    }

    if (!session) {
      openAuthModal(t('auth.loginToVote'), 'signIn')
      return
    }

    const winningSide =
      currentCard.left.votes === currentCard.right.votes
        ? side
        : currentCard.left.votes > currentCard.right.votes
          ? 'left'
          : 'right'

    const result: RoundResult = {
      cardId: currentCard.id,
      room: currentCard.room,
      selectedSide: side,
      leftVotes: currentCard.left.votes,
      rightVotes: currentCard.right.votes,
      matched: side === winningSide,
      xpGain: side === winningSide ? 28 : 34,
      sparksGain: side === winningSide ? 18 : 22,
      playedAt: getTimestamp(),
    }

    setLastResult(result)
    setHistory((previous) => [result, ...previous].slice(0, 8))
    setStreak((previous) => previous + 1)
    setVisitedRooms((previous) => (previous.includes(currentCard.room) ? previous : [...previous, currentCard.room]))
    setSelectedBoardCardId(currentCard.id)
    advanceCard(currentCard.id)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  function handleLanguageChange(nextLanguage: Locale) {
    if (isAuthModalOpen && authMode === 'signUp' && !nicknameTouchedRef.current) {
      setAuthDisplayName(getRandomNickname(nextLanguage))
    }

    startTransition(() => {
      void i18n.changeLanguage(nextLanguage)
    })
  }

  function handleRandomNickname() {
    nicknameTouchedRef.current = true
    setAuthDisplayName(getRandomNickname(locale))
  }

  async function handleSendVerification() {
    if (!supabase) {
      setAuthFeedback('error', t('auth.setupNeeded'))
      return
    }

    if (!authEmail.trim() || !authDisplayName.trim()) {
      setAuthFeedback('error', t('auth.fillAll'))
      return
    }

    setAuthBusy('sendVerification')
    setAuthFeedback('idle', '')

    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: {
        shouldCreateUser: true,
      },
    })

    setAuthBusy(null)

    if (error) {
      setAuthFeedback('error', error.message)
      return
    }

    setAuthFeedback('success', t('auth.verificationSent', { email: authEmail.trim() }))
  }

  async function handleVerifyEmail() {
    if (!supabase) {
      setAuthFeedback('error', t('auth.setupNeeded'))
      return
    }

    if (!authEmail.trim() || !authVerificationCode.trim()) {
      setAuthFeedback('error', t('auth.fillAll'))
      return
    }

    setAuthBusy('verifyEmail')
    setAuthFeedback('idle', '')

    const { error } = await supabase.auth.verifyOtp({
      email: authEmail.trim(),
      token: authVerificationCode.trim(),
      type: 'email',
    })

    setAuthBusy(null)

    if (error) {
      setAuthFeedback('error', error.message)
      return
    }

    setAuthEmailVerified(true)
    setAuthFeedback('success', t('auth.verificationDone'))
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      setAuthFeedback('error', t('auth.setupNeeded'))
      return
    }

    setAuthBusy(authMode)
    setAuthFeedback('idle', '')

    if (authMode === 'signIn') {
      if (!authEmail.trim() || !authPassword.trim()) {
        setAuthBusy(null)
        setAuthFeedback('error', t('auth.fillAll'))
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      })

      setAuthBusy(null)

      if (error) {
        setAuthFeedback('error', error.message)
        return
      }

      setIsAuthModalOpen(false)
      return
    }

    if (authMode === 'signUp') {
      if (
        !authDisplayName.trim() ||
        !authEmail.trim() ||
        !authPassword.trim() ||
        !authPasswordConfirm.trim() ||
        !authVerificationCode.trim()
      ) {
        setAuthBusy(null)
        setAuthFeedback('error', t('auth.fillAll'))
        return
      }

      if (!authEmailVerified) {
        setAuthBusy(null)
        setAuthFeedback('error', locale === 'ko' ? '이메일 인증부터 끝내 주세요.' : 'Verify your email first.')
        return
      }

      if (authPassword !== authPasswordConfirm) {
        setAuthBusy(null)
        setAuthFeedback('error', t('auth.passwordMismatch'))
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: authPassword,
        data: {
          name: authDisplayName.trim(),
          nickname: authDisplayName.trim(),
          locale,
        },
      })

      setAuthBusy(null)

      if (error) {
        setAuthFeedback('error', error.message)
        return
      }

      setIsAuthModalOpen(false)
      return
    }

    if (authMode === 'forgotPassword') {
      if (!authEmail.trim()) {
        setAuthBusy(null)
        setAuthFeedback('error', t('auth.fillAll'))
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      })

      setAuthBusy(null)

      if (error) {
        setAuthFeedback('error', error.message)
        return
      }

      setAuthFeedback('success', t('auth.resetSent', { email: authEmail.trim() }))
      return
    }

    if (!passwordRecoveryReady) {
      setAuthBusy(null)
      setAuthFeedback('error', t('auth.checkEmail'))
      return
    }

    if (!authPassword.trim() || !authPasswordConfirm.trim()) {
      setAuthBusy(null)
      setAuthFeedback('error', t('auth.fillAll'))
      return
    }

    if (authPassword !== authPasswordConfirm) {
      setAuthBusy(null)
      setAuthFeedback('error', t('auth.passwordMismatch'))
      return
    }

    const { error } = await supabase.auth.updateUser({ password: authPassword })

    setAuthBusy(null)

    if (error) {
      setAuthFeedback('error', error.message)
      return
    }

    setPasswordRecoveryReady(false)
    setAuthMode('signIn')
    setAuthPassword('')
    setAuthPasswordConfirm('')
    setAuthFeedback('success', t('auth.passwordUpdated'))
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  function handleLikeComment(commentId: string) {
    setStoredDiscussionComments((previous) => {
      const base = previous.length > 0 ? previous : seedDiscussionComments
      return base.map((comment) =>
        comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment,
      )
    })
  }

  function handleCommentSubmit(event: FormEvent<HTMLFormElement>, cardId: string) {
    event.preventDefault()

    if (!session) {
      openAuthModal(boardCopy.loginToComment, 'signIn')
      return
    }

    if (!commentDraft.trim()) {
      return
    }

    const nextComment: DiscussionComment = {
      id: `local-${getTimestamp()}`,
      cardId,
      author: getDisplayName(session, locale),
      text: commentDraft.trim(),
      likes: 0,
      createdAt: getTimestamp(),
    }

    setStoredDiscussionComments((previous) => {
      const base = previous.length > 0 ? previous : seedDiscussionComments
      return [nextComment, ...base]
    })
    setCommentDraft('')
  }

  const selectedCard = lastResult ? cardsById.get(lastResult.cardId) ?? null : null
  const signInLabel = session ? t('auth.currentUser', { name: getDisplayName(session, locale) }) : t('auth.loginButton')

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brandBlock">
          <div className="logoBadge" aria-hidden="true">
            <img className="logoImage" src={logoMark} alt="" />
          </div>
          <div>
            <p className="brand">{t('brand.name')}</p>
            <span className="brandSub">{t('brand.tagline')}</span>
          </div>
        </div>

        <div className="utilityGroup">
          {isDbConnected ? <span className="statusPill online">{t('system.dbReady')}</span> : null}

          <div className="themeSwitch" aria-label={locale === 'ko' ? '테마 선택' : 'Choose theme'}>
            {([
              { id: 'citrus', label: locale === 'ko' ? '기본' : 'Citrus', className: 'citrus' },
              { id: 'ocean', label: locale === 'ko' ? '오션' : 'Ocean', className: 'ocean' },
              { id: 'berry', label: locale === 'ko' ? '베리' : 'Berry', className: 'berry' },
            ] as Array<{ id: ThemeName; label: string; className: string }>).map((option) => (
              <button
                key={option.id}
                type="button"
                className={`themeButton ${option.className} ${theme === option.id ? 'active' : ''}`}
                onClick={() => setTheme(option.id)}
                title={option.label}
                aria-label={option.label}
              >
                <span className="themeSwatch" />
              </button>
            ))}
          </div>

          <div className="languageSwitch" aria-label={t('system.language')}>
            {(['ko', 'en'] as const).map((language) => (
              <button
                key={language}
                type="button"
                className={`languageButton ${locale === language ? 'active' : ''}`}
                onClick={() => handleLanguageChange(language)}
              >
                {language === 'ko' ? 'KR' : 'EN'}
              </button>
            ))}
          </div>

          {view === 'board' ? (
            <button type="button" className="secondaryButton" onClick={handleBackHome}>
              {boardCopy.boardBack}
            </button>
          ) : null}

          {session ? (
            <>
              <span className="userBadge">{signInLabel}</span>
              <button type="button" className="secondaryButton" onClick={handleSignOut}>
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            <button type="button" className="secondaryButton" onClick={() => openAuthModal(undefined, 'signIn')}>
              {t('auth.loginButton')}
            </button>
          )}

          <button type="button" className="primaryButton" onClick={handleCopy}>
            {t('actions.invite')}
          </button>
        </div>
      </header>

      {view === 'home' ? (
        <>
          <section className="heroSection">
            <article className="heroCard">
              <span className="eyebrow">{t('hero.badge')}</span>
              <h1>{t('hero.title')}</h1>
              <p className="heroText">{t('hero.description')}</p>

              <div className="heroActions">
                <button
                  type="button"
                  className="primaryButton"
                  onClick={() => battleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {boardCopy.pollOpen}
                </button>
                <button type="button" className="secondaryButton" onClick={() => handleOpenBoard(currentCard?.id)}>
                  {boardCopy.boardCta}
                </button>
              </div>

              <div className="heroStats">
                <div className="statCard">
                  <span>{t('stats.liveLabel')}</span>
                  <strong>{liveUsers}</strong>
                  <small>{t('stats.liveNote')}</small>
                </div>
                <div className="statCard">
                  <span>{t('stats.sessionLabel')}</span>
                  <strong>{t('stats.sessionValue', { value: avgSession })}</strong>
                  <small>{t('stats.sessionNote')}</small>
                </div>
                <div className="statCard">
                  <span>{t('stats.shareLabel')}</span>
                  <strong>{commentRate}</strong>
                  <small>{t('stats.shareNote')}</small>
                </div>
              </div>
            </article>

            <aside className="heroSideCard dashboardCard">
              <div className="miniTitleRow">
                <div>
                  <h2>{boardCopy.trendTitle}</h2>
                  <p className="supportText">{boardCopy.trendSubtitle}</p>
                </div>
                <span className="metaChip">
                  {boardCopy.strongestBoard}:{' '}
                  {t(`rooms.${[...boardMetrics].sort((left, right) => right.strength - left.strength)[0]?.room ?? 'Weekend'}`)}
                </span>
              </div>

              <div className="chartList">
                {boardMetrics.map((metric) => (
                  <div key={metric.room} className="chartRow">
                    <div className="chartLabelRow">
                      <strong>{t(`rooms.${metric.room}`)}</strong>
                      <span>{boardCopy.estimatedVotes(metric.votes)}</span>
                    </div>
                    <div className="chartTrack">
                      <div className="chartFill" style={{ width: `${Math.max(12, (metric.strength / maxBoardStrength) * 100)}%` }} />
                    </div>
                    <div className="metricMiniRow">
                      <span>{boardCopy.commentCount(metric.comments)}</span>
                      <span>{boardCopy.thinkTime(metric.thinkTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="sectionBlock">
            <div className="sectionHead">
              <div>
                <h2>{boardCopy.liveTopicsTitle}</h2>
                <p className="supportText">{boardCopy.liveTopicsSubtitle}</p>
              </div>
              <button type="button" className="secondaryButton" onClick={() => handleOpenBoard(hotTopics[0]?.card.id)}>
                {boardCopy.boardCta}
              </button>
            </div>

            <div className="topicGrid">
              {hotTopics.map((topic) => {
                const leadingSide = topic.card.left.votes >= topic.card.right.votes ? topic.card.left : topic.card.right
                const metricLabel =
                  topic.kind === 'votes'
                    ? boardCopy.estimatedVotes(getEstimatedVotes(topic.card))
                    : topic.kind === 'thinking'
                      ? boardCopy.thinkTime(getEstimatedThinkTime(topic.card))
                      : boardCopy.spread(getVoteSpread(topic.card))
                const topicLabel =
                  topic.kind === 'votes'
                    ? t('today.voteLeader')
                    : topic.kind === 'thinking'
                      ? t('today.thinkLeader')
                      : t('today.landslideLeader')
                const commentCount = commentsByCard.get(topic.card.id)?.length ?? 0

                return (
                  <article key={topic.kind} className="topicPanel">
                    <span className="metaChip">{topicLabel}</span>
                    <strong>{topic.card.prompt}</strong>
                    <p className="supportText">{topic.card.context}</p>
                    <div className="topicMetricList">
                      <span className="topicMetric">{metricLabel}</span>
                      <span className="topicMetric">{boardCopy.commentCount(commentCount)}</span>
                    </div>
                    <div className="topicFooter">
                      <span>{leadingSide.label} · {leadingSide.votes}%</span>
                      <button type="button" className="textButton" onClick={() => handleOpenBoard(topic.card.id)}>
                        {boardCopy.openBoard}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <nav className="roomRail" aria-label={boardCopy.boardNavLabel}>
            {(['All', ...ROOM_ORDER] as Room[]).map((room) => (
              <button
                key={room}
                type="button"
                className={`roomPill ${activeRoom === room ? 'active' : ''}`}
                onClick={() => handleRoomChange(room)}
              >
                {t(`rooms.${room}`)}
              </button>
            ))}
          </nav>

          <section className="arenaLayout">
            <article className="battlePanel" ref={battleRef}>
              {currentCard ? (
                <>
                  <div className="battleMeta">
                    <span className="metaChip">{currentCard.heat}</span>
                    <span>{t(`rooms.${currentCard.room}`)}</span>
                  </div>
                  <h2>{currentCard.prompt}</h2>
                  <p className="supportText">{currentCard.context}</p>

                  <div className="choiceGrid">
                    <button type="button" className="voteButton warm" onClick={() => handleVote('left')}>
                      <span className="choiceLabel">{currentCard.left.label}</span>
                      <span className="choiceDetail">{currentCard.left.detail}</span>
                      <span className={`choiceVotes ${session ? '' : 'locked'}`}>
                        {session ? `${currentCard.left.votes}%` : t('battle.hiddenVotes')}
                      </span>
                    </button>

                    <button type="button" className="voteButton cool" onClick={() => handleVote('right')}>
                      <span className="choiceLabel">{currentCard.right.label}</span>
                      <span className="choiceDetail">{currentCard.right.detail}</span>
                      <span className={`choiceVotes ${session ? '' : 'locked'}`}>
                        {session ? `${currentCard.right.votes}%` : t('battle.hiddenVotes')}
                      </span>
                    </button>
                  </div>

                  {!session ? (
                    <div className="authGate">
                      <strong>{t('auth.title')}</strong>
                      <p className="supportText">{t('auth.loginToVote')}</p>
                      <button type="button" className="primaryButton" onClick={() => openAuthModal(undefined, 'signIn')}>
                        {t('auth.loginButton')}
                      </button>
                    </div>
                  ) : null}

                  <div className="battleFooter">
                    <span>{t('battle.compare')}</span>
                    <button type="button" className="textButton" onClick={() => handleOpenBoard(currentCard.id)}>
                      {boardCopy.openBoard}
                    </button>
                  </div>
                </>
              ) : (
                <p className="emptyState">{boardCopy.latestChoiceEmpty}</p>
              )}
            </article>

            <aside className="sideColumn">
              <section className="sideCard discussionPanel">
                <div className="miniTitleRow">
                  <div>
                    <h3>{boardCopy.discussionTitle}</h3>
                    <p className="supportText">{boardCopy.discussionSubtitle}</p>
                  </div>
                  {currentCard ? <span className="metaChip">{boardCopy.commentCount(currentCardComments.length)}</span> : null}
                </div>

                {currentCard ? (
                  <>
                    <div className="metricStrip">
                      <div className="metricCard">
                        <span>{boardCopy.voteMetric}</span>
                        <strong>{formatNumber(locale, getEstimatedVotes(currentCard))}</strong>
                      </div>
                      <div className="metricCard">
                        <span>{boardCopy.thinkMetric}</span>
                        <strong>{getEstimatedThinkTime(currentCard)}초</strong>
                      </div>
                    </div>

                    {selectedCard ? (
                      <div className="resultInline">
                        <strong>{boardCopy.latestChoice}</strong>
                        <p>{lastResult?.matched ? boardCopy.resultsAgree : boardCopy.resultsMinority}</p>
                      </div>
                    ) : (
                      <div className="resultInline empty">
                        <strong>{boardCopy.latestChoice}</strong>
                        <p>{boardCopy.latestChoiceEmpty}</p>
                      </div>
                    )}

                    <div className="threadList">
                      {currentCardComments.length > 0 ? (
                        currentCardComments.map((comment) => (
                          <div key={comment.id} className="threadItem">
                            <div className="commentMeta">
                              <strong>{comment.author}</strong>
                              <span>{formatRelativeTime(locale, comment.createdAt)}</span>
                            </div>
                            <p>{comment.text}</p>
                            <div className="threadActions">
                              <button type="button" className="tinyButton" onClick={() => handleLikeComment(comment.id)}>
                                ♥ {comment.likes}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="emptyState">{boardCopy.boardEmpty}</p>
                      )}
                    </div>

                    <button type="button" className="secondaryButton fullWidth" onClick={() => handleOpenBoard(currentCard.id)}>
                      {boardCopy.openComments}
                    </button>
                  </>
                ) : null}
              </section>
            </aside>
          </section>

          <section className="sectionBlock boardPreviewSection">
            <div className="sectionHead">
              <div>
                <h2>{boardCopy.boardPreviewTitle}</h2>
                <p className="supportText">{boardCopy.boardPreviewSubtitle}</p>
              </div>
              <button type="button" className="secondaryButton" onClick={() => handleOpenBoard(boardPostsFiltered[0]?.card.id)}>
                {boardCopy.boardCta}
              </button>
            </div>

            <div className="boardPreviewList">
              {boardPostsFiltered.slice(0, 5).map((post) => (
                <button key={post.card.id} type="button" className="boardPreviewRow" onClick={() => handleOpenBoard(post.card.id)}>
                  <div className="boardPreviewInfo">
                    <div className="boardPreviewMeta">
                      <span className="metaChip">{t(`rooms.${post.card.room}`)}</span>
                      <span>{boardCopy.commentCount(post.commentCount)}</span>
                      <span>{boardCopy.thinkTime(post.thinkTime)}</span>
                    </div>
                    <strong>{post.card.prompt}</strong>
                    <p className="boardPreviewSnippet">{post.latestComment?.text ?? post.card.context}</p>
                  </div>
                  <span className="boardPreviewArrow">›</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="boardPage">
          <div className="sectionBlock boardHero">
            <div className="sectionHead">
              <div>
                <h1>{boardCopy.boardPageTitle}</h1>
                <p className="heroText">{boardCopy.boardPageSubtitle}</p>
              </div>
              <button type="button" className="secondaryButton" onClick={handleBackHome}>
                {boardCopy.boardBack}
              </button>
            </div>
          </div>

          <nav className="roomRail" aria-label={boardCopy.boardNavLabel}>
            {(['All', ...ROOM_ORDER] as Room[]).map((room) => (
              <button
                key={room}
                type="button"
                className={`roomPill ${activeRoom === room ? 'active' : ''}`}
                onClick={() => handleRoomChange(room)}
              >
                {t(`rooms.${room}`)}
              </button>
            ))}
          </nav>

          <section className="boardLayout">
            <article className="surfaceCard boardListCard">
              <div className="miniTitleRow">
                <div>
                  <h3>{boardCopy.boardPreviewTitle}</h3>
                  <p className="supportText">{boardCopy.latestActivity}</p>
                </div>
              </div>

              <div className="boardList">
                {boardPostsFiltered.map((post) => (
                  <button
                    key={post.card.id}
                    type="button"
                    className={`boardRow ${activeBoardCard?.id === post.card.id ? 'active' : ''}`}
                    onClick={() => setSelectedBoardCardId(post.card.id)}
                  >
                    <div className="boardRowHeader">
                      <span className="metaChip">{t(`rooms.${post.card.room}`)}</span>
                      <span>{boardCopy.commentCount(post.commentCount)}</span>
                    </div>
                    <strong>{post.card.prompt}</strong>
                    <p>{post.latestComment?.text ?? post.card.context}</p>
                    <div className="boardRowFooter">
                      <span>{boardCopy.estimatedVotes(post.estimatedVotes)}</span>
                      <span>{boardCopy.thinkTime(post.thinkTime)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <article className="surfaceCard boardDetailCard">
              {activeBoardCard ? (
                <>
                  <div className="battleMeta">
                    <span className="metaChip">{t(`rooms.${activeBoardCard.room}`)}</span>
                    <span>{boardCopy.commentCount(activeBoardComments.length)}</span>
                  </div>
                  <h2>{activeBoardCard.prompt}</h2>
                  <p className="supportText">{activeBoardCard.context}</p>

                  <div className="voteBars compact">
                    <div className="voteBarRow">
                      <span>{activeBoardCard.left.label}</span>
                      <div className="voteBarTrack">
                        <div className="voteBar hot" style={{ width: `${activeBoardCard.left.votes}%` }} />
                      </div>
                      <strong>{session ? `${activeBoardCard.left.votes}%` : '??'}</strong>
                    </div>
                    <div className="voteBarRow">
                      <span>{activeBoardCard.right.label}</span>
                      <div className="voteBarTrack">
                        <div className="voteBar cool" style={{ width: `${activeBoardCard.right.votes}%` }} />
                      </div>
                      <strong>{session ? `${activeBoardCard.right.votes}%` : '??'}</strong>
                    </div>
                  </div>

                  <div className="topicMetricList summary">
                    <span className="topicMetric">{boardCopy.estimatedVotes(getEstimatedVotes(activeBoardCard))}</span>
                    <span className="topicMetric">{boardCopy.thinkTime(getEstimatedThinkTime(activeBoardCard))}</span>
                    <span className="topicMetric">{boardCopy.spread(getVoteSpread(activeBoardCard))}</span>
                  </div>

                  <form className="commentForm" onSubmit={(event) => handleCommentSubmit(event, activeBoardCard.id)}>
                    <textarea
                      className="commentTextarea"
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder={boardCopy.commentPlaceholder}
                    />
                    <div className="authButtonRow">
                      <button type="submit" className="primaryButton authRowButton">
                        {boardCopy.commentSubmit}
                      </button>
                      {!session ? (
                        <button type="button" className="secondaryButton authRowButton" onClick={() => openAuthModal(undefined, 'signIn')}>
                          {t('auth.loginButton')}
                        </button>
                      ) : null}
                    </div>
                  </form>

                  <div className="commentList">
                    {activeBoardComments.length > 0 ? (
                      activeBoardComments.map((comment) => (
                        <div key={comment.id} className="commentItem boardCommentItem">
                          <div className="commentMeta">
                            <strong>{comment.author}</strong>
                            <span>{formatRelativeTime(locale, comment.createdAt)}</span>
                          </div>
                          <p>{comment.text}</p>
                          <div className="threadActions">
                            <button type="button" className="tinyButton" onClick={() => handleLikeComment(comment.id)}>
                              ♥ {comment.likes}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="emptyState">{boardCopy.boardEmpty}</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="emptyState">{boardCopy.boardEmpty}</p>
              )}
            </article>
          </section>
        </section>
      )}

      {isAuthModalOpen ? (
        <div className="authModalBackdrop" role="dialog" aria-modal="true" aria-label={t('auth.modalTitle')}>
          <div className="authModalCard">
            <div className="miniTitleRow">
              <div>
                <h2>{t('auth.modalTitle')}</h2>
                <p className="supportText">{t('auth.modalSubtitle')}</p>
              </div>
              <button type="button" className="ghostButton" onClick={closeAuthModal}>
                {t('auth.close')}
              </button>
            </div>

            <div className="authTabs">
              <button
                type="button"
                className={`authTabButton ${authMode === 'signIn' ? 'active' : ''}`}
                onClick={() => handleAuthModeChange('signIn')}
              >
                {t('auth.signInTab')}
              </button>
              <button
                type="button"
                className={`authTabButton ${authMode === 'signUp' ? 'active' : ''}`}
                onClick={() => handleAuthModeChange('signUp')}
              >
                {t('auth.signUpTab')}
              </button>
            </div>

            {authMode === 'forgotPassword' || authMode === 'resetPassword' ? (
              <div className="authModePill">{authMode === 'forgotPassword' ? t('auth.forgotTab') : t('auth.resetTab')}</div>
            ) : null}

            <form className="authForm" onSubmit={handleAuthSubmit}>
              {authMode === 'signUp' ? (
                <>
                  <div className="authField">
                    <label htmlFor="nickname">{t('auth.nameLabel')}</label>
                    <div className="inputWithAction">
                      <input
                        id="nickname"
                        className="authInput withAction"
                        value={authDisplayName}
                        onChange={(event) => {
                          nicknameTouchedRef.current = true
                          setAuthDisplayName(event.target.value)
                        }}
                        placeholder={t('auth.namePlaceholder')}
                      />
                      <button
                        type="button"
                        className="inputIconButton"
                        onClick={handleRandomNickname}
                        aria-label={t('auth.randomNickname')}
                        title={t('auth.randomNickname')}
                      >
                        ⟳
                      </button>
                    </div>
                  </div>

                  <div className="authField">
                    <label htmlFor="signup-email">{t('auth.emailLabel')}</label>
                    <div className="inlineField">
                      <input
                        id="signup-email"
                        className="authInput"
                        type="email"
                        value={authEmail}
                        onChange={(event) => {
                          setAuthEmail(event.target.value)
                          setAuthEmailVerified(false)
                        }}
                        placeholder={t('auth.emailPlaceholder')}
                      />
                      <button
                        type="button"
                        className="secondaryButton inlineActionButton"
                        onClick={() => void handleSendVerification()}
                        disabled={authBusy !== null || !supabase}
                      >
                        {authBusy === 'sendVerification' ? t('auth.checking') : t('auth.sendVerification')}
                      </button>
                    </div>
                  </div>

                  <div className="authField">
                    <label htmlFor="signup-code">{t('auth.verificationCodeLabel')}</label>
                    <div className="inlineField">
                      <input
                        id="signup-code"
                        className="authInput"
                        value={authVerificationCode}
                        onChange={(event) => setAuthVerificationCode(event.target.value)}
                        placeholder={t('auth.verificationCodePlaceholder')}
                      />
                      <button
                        type="button"
                        className="secondaryButton inlineActionButton"
                        onClick={() => void handleVerifyEmail()}
                        disabled={authBusy !== null || !supabase}
                      >
                        {authBusy === 'verifyEmail' ? t('auth.checking') : t('auth.verifyEmail')}
                      </button>
                    </div>
                  </div>

                  <div className="authField">
                    <label htmlFor="signup-password">{t('auth.passwordLabel')}</label>
                    <input
                      id="signup-password"
                      className="authInput"
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>

                  <div className="authField">
                    <label htmlFor="signup-password-confirm">{t('auth.passwordConfirmLabel')}</label>
                    <input
                      id="signup-password-confirm"
                      className="authInput"
                      type="password"
                      value={authPasswordConfirm}
                      onChange={(event) => setAuthPasswordConfirm(event.target.value)}
                      placeholder={t('auth.passwordConfirmPlaceholder')}
                    />
                  </div>
                </>
              ) : null}

              {authMode === 'signIn' ? (
                <>
                  <div className="authField">
                    <label htmlFor="signin-email">{t('auth.emailLabel')}</label>
                    <input
                      id="signin-email"
                      className="authInput"
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>

                  <div className="authField">
                    <label htmlFor="signin-password">{t('auth.passwordLabel')}</label>
                    <input
                      id="signin-password"
                      className="authInput"
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>
                </>
              ) : null}

              {authMode === 'forgotPassword' ? (
                <div className="authField">
                  <label htmlFor="forgot-email">{t('auth.emailLabel')}</label>
                  <input
                    id="forgot-email"
                    className="authInput"
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
              ) : null}

              {authMode === 'resetPassword' ? (
                <>
                  <div className="authField">
                    <label htmlFor="reset-password">{t('auth.passwordLabel')}</label>
                    <input
                      id="reset-password"
                      className="authInput"
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>

                  <div className="authField">
                    <label htmlFor="reset-password-confirm">{t('auth.passwordConfirmLabel')}</label>
                    <input
                      id="reset-password-confirm"
                      className="authInput"
                      type="password"
                      value={authPasswordConfirm}
                      onChange={(event) => setAuthPasswordConfirm(event.target.value)}
                      placeholder={t('auth.passwordConfirmPlaceholder')}
                    />
                  </div>
                </>
              ) : null}

              <div className="authButtonRow">
                <button type="submit" className="primaryButton authRowButton" disabled={authBusy !== null || !supabase || !authReady}>
                  {authBusy === authMode
                    ? t('auth.checking')
                    : authMode === 'signIn'
                      ? t('auth.signInSubmit')
                      : authMode === 'signUp'
                        ? t('auth.signUpSubmit')
                        : authMode === 'forgotPassword'
                          ? t('auth.forgotSubmit')
                          : t('auth.resetSubmit')}
                </button>

                {authMode === 'signIn' ? (
                  <button type="button" className="secondaryButton authRowButton" onClick={() => handleAuthModeChange('signUp')}>
                    {t('auth.switchToSignUp')}
                  </button>
                ) : null}

                {authMode === 'signUp' ? (
                  <button type="button" className="secondaryButton authRowButton" onClick={() => handleAuthModeChange('signIn')}>
                    {t('auth.switchToSignIn')}
                  </button>
                ) : null}
              </div>
            </form>

            {authMode === 'signIn' ? (
              <button type="button" className="textButton" onClick={() => handleAuthModeChange('forgotPassword')}>
                {t('auth.forgotPassword')}
              </button>
            ) : null}

            {authMode === 'forgotPassword' || authMode === 'resetPassword' ? (
              <button type="button" className="textButton" onClick={() => handleAuthModeChange('signIn')}>
                {t('auth.backToLogin')}
              </button>
            ) : null}

            <span className={`authHint ${authStatus !== 'idle' ? authStatus : 'subtle'}`}>
              {authMessage || t('auth.secureNote')}
            </span>
            {authMode === 'signUp' ? <span className="authHint subtle">{t('auth.passwordHint')}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
