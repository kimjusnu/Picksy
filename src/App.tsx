
import { startTransition, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import './App.css'
import logoMark from './assets/picksy-logo.svg'
import { fetchRemoteCatalog, type RemoteCatalog } from './lib/content'
import { getEstimatedThinkTime, getEstimatedVotes, getHotTopics, getVoteSpread } from './lib/engagement'
import { getRandomNickname } from './lib/nicknames'
import { isDbConnected, supabase } from './lib/supabase'
import type {
  BadgeId,
  BattleCard,
  CommentEntry,
  LeaderboardEntry,
  MissionCopy,
  MissionId,
  PlayableRoom,
  Room,
  RoundResult,
  Side,
} from './types'

type Locale = 'ko' | 'en'
type ThemeName = 'citrus' | 'ocean' | 'berry'
type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword'
type AuthBusy = AuthMode | 'sendVerification' | 'verifyEmail' | null
type AuthStatus = 'idle' | 'success' | 'error'

type SessionSnapshot = {
  activeRoom: Room
  streak: number
  xp: number
  sparks: number
  visitedRooms: PlayableRoom[]
}

type UserProgressSnapshot = {
  points: number
  claimedMissionIds: MissionId[]
  claimedDate: string
}

type BadgeCopy = {
  id: BadgeId
  name: string
  summary: string
  threshold: number
}

type MissionView = MissionCopy & {
  current: number
  goal: number
  claimable: boolean
  claimed: boolean
}

const SESSION_KEY = 'picksy-session-v4'
const USER_PROGRESS_PREFIX = 'picksy-user-progress-v4:'
const THEME_KEY = 'picksy-theme'
const ROOM_ORDER: PlayableRoom[] = ['Weekend', 'Work', 'Food', 'Travel', 'Dating']
const MISSION_GOALS: Record<MissionId, number> = {
  daily_flip: 3,
  crowd_reader: 2,
  room_hopper: 2,
  streak_builder: 5,
}

const DEFAULT_SESSION: SessionSnapshot = {
  activeRoom: 'All',
  streak: 0,
  xp: 0,
  sparks: 0,
  visitedRooms: [],
}

const DEFAULT_PROGRESS: UserProgressSnapshot = {
  points: 0,
  claimedMissionIds: [],
  claimedDate: '',
}

function getTodayKey() {
  return new Date().toLocaleDateString('sv-SE')
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
      xp: parsed.xp ?? DEFAULT_SESSION.xp,
      sparks: parsed.sparks ?? DEFAULT_SESSION.sparks,
      visitedRooms: Array.isArray(parsed.visitedRooms)
        ? parsed.visitedRooms.filter((room): room is PlayableRoom => ROOM_ORDER.includes(room as PlayableRoom))
        : DEFAULT_SESSION.visitedRooms,
    }
  } catch {
    return DEFAULT_SESSION
  }
}

function readUserProgress(userId: string): UserProgressSnapshot {
  if (typeof window === 'undefined') {
    return DEFAULT_PROGRESS
  }

  try {
    const raw = window.localStorage.getItem(`${USER_PROGRESS_PREFIX}${userId}`)
    if (!raw) {
      return DEFAULT_PROGRESS
    }

    const parsed = JSON.parse(raw) as Partial<UserProgressSnapshot>
    const today = getTodayKey()

    return {
      points: parsed.points ?? 0,
      claimedMissionIds:
        parsed.claimedDate === today && Array.isArray(parsed.claimedMissionIds)
          ? parsed.claimedMissionIds.filter((id): id is MissionId => id in MISSION_GOALS)
          : [],
      claimedDate: parsed.claimedDate === today ? today : today,
    }
  } catch {
    return DEFAULT_PROGRESS
  }
}

function getUserStorageKey(session: Session | null) {
  return session?.user?.id ?? 'guest'
}

function getDisplayName(session: Session | null, locale: Locale) {
  const fallback = locale === 'ko' ? 'Picksy 게스트' : 'Picksy guest'
  return (
    session?.user?.user_metadata?.nickname ??
    session?.user?.user_metadata?.name ??
    session?.user?.email?.split('@')[0] ??
    fallback
  )
}

function getBadgeCatalog(locale: Locale): BadgeCopy[] {
  if (locale === 'ko') {
    return [
      { id: 'rookie', name: '첫 픽', summary: 'Picksy에 처음 발을 들였어요.', threshold: 0 },
      { id: 'trend', name: '트렌드 스캐너', summary: '사람들이 많이 누르는 흐름을 읽기 시작했어요.', threshold: 300 },
      { id: 'insider', name: '픽시 인사이더', summary: '오래 머무르며 방을 돌고 미션도 챙겨요.', threshold: 700 },
      { id: 'legend', name: '핫픽 레전드', summary: '오늘 기록과 미션을 거의 다 가져가는 사람입니다.', threshold: 1300 },
    ]
  }

  return [
    { id: 'rookie', name: 'First Pick', summary: 'You just stepped into Picksy.', threshold: 0 },
    { id: 'trend', name: 'Trend Scanner', summary: 'You are starting to read the crowd.', threshold: 300 },
    { id: 'insider', name: 'Picksy Insider', summary: 'You move across rooms and keep coming back.', threshold: 700 },
    { id: 'legend', name: 'Hot Pick Legend', summary: 'You dominate missions and hot topics.', threshold: 1300 },
  ]
}

function formatNumber(locale: Locale, value: number) {
  return value.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')
}

function getSharePercent(result: RoundResult | null) {
  if (!result) {
    return 0
  }

  return result.selectedSide === 'left' ? result.leftVotes : result.rightVotes
}

export default function App() {
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage)
  const battleRef = useRef<HTMLDivElement | null>(null)
  const nicknameTouchedRef = useRef(false)
  const copyTimerRef = useRef<number | null>(null)

  const [theme, setTheme] = useState<ThemeName>(() => readTheme())
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
  const [authDisplayName, setAuthDisplayName] = useState(() => getRandomNickname('ko'))
  const [authEmailVerified, setAuthEmailVerified] = useState(false)
  const [activeRoom, setActiveRoom] = useState<Room>(() => readSession().activeRoom)
  const [streak, setStreak] = useState(() => readSession().streak)
  const [xp, setXp] = useState(() => readSession().xp)
  const [sparks, setSparks] = useState(() => readSession().sparks)
  const [visitedRooms, setVisitedRooms] = useState<PlayableRoom[]>(() => readSession().visitedRooms)
  const [currentCardId, setCurrentCardId] = useState('')
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [history, setHistory] = useState<RoundResult[]>([])
  const [copied, setCopied] = useState(false)
  const [points, setPoints] = useState(() => readUserProgress('guest').points)
  const [claimedMissionIds, setClaimedMissionIds] = useState<MissionId[]>(() => readUserProgress('guest').claimedMissionIds)

  const localCards = useMemo(() => t('cards', { returnObjects: true }) as unknown as BattleCard[], [t])
  const localLeaderboard = useMemo(
    () => t('leaderboard', { returnObjects: true }) as unknown as LeaderboardEntry[],
    [t],
  )
  const localRewards = useMemo(() => t('rewards', { returnObjects: true }) as unknown as string[], [t])
  const localComments = useMemo(
    () => t('community.items', { returnObjects: true }) as unknown as CommentEntry[],
    [t],
  )
  const missionCopy = useMemo(
    () => t('missions.items', { returnObjects: true }) as unknown as MissionCopy[],
    [t],
  )

  const cards = remoteCatalog?.cards ?? localCards
  const leaderboard = remoteCatalog?.leaderboard ?? localLeaderboard
  const rewards = remoteCatalog?.rewards ?? localRewards
  const comments = remoteCatalog?.comments ?? localComments

  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const filteredCards = useMemo(
    () => (activeRoom === 'All' ? cards : cards.filter((card) => card.room === activeRoom)),
    [activeRoom, cards],
  )
  const currentCard = useMemo(() => {
    if (currentCardId && cardsById.has(currentCardId)) {
      const current = cardsById.get(currentCardId)
      if (activeRoom === 'All' || current?.room === activeRoom) {
        return current ?? filteredCards[0] ?? cards[0] ?? null
      }
    }

    return filteredCards[0] ?? cards[0] ?? null
  }, [activeRoom, cards, cardsById, currentCardId, filteredCards])

  const hotTopics = useMemo(() => {
    const topicOrder = ['votes', 'thinking', 'landslide'] as const
    return getHotTopics(cards).sort((left, right) => topicOrder.indexOf(left.kind) - topicOrder.indexOf(right.kind))
  }, [cards])

  const crowdMatches = history.filter((result) => result.matched).length
  const avgSession = (3.4 + Math.min(2.1, history.length * 0.22)).toFixed(1)
  const shareRate = `${Math.min(86, 41 + history.length * 6)}%`
  const liveUsers = formatNumber(locale, 1280 + cards.length * 17 + history.length * 24 + (session ? 120 : 0))
  const badgeCatalog = getBadgeCatalog(locale)
  const currentBadge = badgeCatalog.filter((badge) => points >= badge.threshold).at(-1) ?? badgeCatalog[0]
  const nextBadge = badgeCatalog.find((badge) => points < badge.threshold) ?? null
  const unlockedBadges = badgeCatalog.filter((badge) => points >= badge.threshold)
  const badgeProgressCurrent = nextBadge ? points - currentBadge.threshold : 1
  const badgeProgressGoal = nextBadge ? nextBadge.threshold - currentBadge.threshold : 1
  const badgeProgressPercent = nextBadge
    ? Math.min(100, Math.round((badgeProgressCurrent / Math.max(1, badgeProgressGoal)) * 100))
    : 100
  const level = Math.max(1, Math.floor(xp / 120) + 1)

  const themeOptions: Array<{ id: ThemeName; label: string; className: string }> =
    locale === 'ko'
      ? [
          { id: 'citrus', label: '기본', className: 'citrus' },
          { id: 'ocean', label: '오션', className: 'ocean' },
          { id: 'berry', label: '베리', className: 'berry' },
        ]
      : [
          { id: 'citrus', label: 'Citrus', className: 'citrus' },
          { id: 'ocean', label: 'Ocean', className: 'ocean' },
          { id: 'berry', label: 'Berry', className: 'berry' },
        ]

  const roomComments = useMemo(
    () => (activeRoom === 'All' ? comments : comments.filter((item) => item.room === activeRoom)),
    [activeRoom, comments],
  )

  const missionProgress = useMemo(
    () => ({
      daily_flip: history.length,
      crowd_reader: crowdMatches,
      room_hopper: visitedRooms.length,
      streak_builder: streak,
    }),
    [crowdMatches, history.length, streak, visitedRooms.length],
  )

  const missions = useMemo<MissionView[]>(
    () =>
      missionCopy.map((mission) => {
        const goal = MISSION_GOALS[mission.id]
        const current = missionProgress[mission.id]
        const claimed = claimedMissionIds.includes(mission.id)

        return {
          ...mission,
          goal,
          current,
          claimed,
          claimable: current >= goal && !claimed,
        }
      }),
    [claimedMissionIds, missionCopy, missionProgress],
  )

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
      xp,
      sparks,
      visitedRooms,
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
  }, [activeRoom, sparks, streak, visitedRooms, xp])

  useEffect(() => {
    const progress: UserProgressSnapshot = {
      points,
      claimedMissionIds,
      claimedDate: getTodayKey(),
    }

    window.localStorage.setItem(`${USER_PROGRESS_PREFIX}${getUserStorageKey(session)}`, JSON.stringify(progress))
  }, [claimedMissionIds, points, session])

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
      const progress = readUserProgress(getUserStorageKey(data.session ?? null))
      setPoints(progress.points)
      setClaimedMissionIds(progress.claimedMissionIds)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      const progress = readUserProgress(getUserStorageKey(nextSession))
      setPoints(progress.points)
      setClaimedMissionIds(progress.claimedMissionIds)

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

  function jumpToCard(card: BattleCard) {
    setActiveRoom(card.room)
    setCurrentCardId(card.id)
    setVisitedRooms((previous) => (previous.includes(card.room) ? previous : [...previous, card.room]))
    battleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleRoomChange(room: Room) {
    setActiveRoom(room)
    if (room !== 'All') {
      setVisitedRooms((previous) => (previous.includes(room) ? previous : [...previous, room]))
    }

    const nextCards = room === 'All' ? cards : cards.filter((card) => card.room === room)
    if (nextCards[0]) {
      setCurrentCardId(nextCards[0].id)
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
      playedAt: Date.now(),
    }

    setLastResult(result)
    setHistory((previous) => [result, ...previous].slice(0, 8))
    setStreak((previous) => previous + 1)
    setXp((previous) => previous + result.xpGain)
    setSparks((previous) => previous + result.sparksGain)
    setVisitedRooms((previous) => (previous.includes(currentCard.room) ? previous : [...previous, currentCard.room]))
    advanceCard(currentCard.id)
  }

  function handleClaimMission(mission: MissionView) {
    if (!mission.claimable) {
      return
    }

    setClaimedMissionIds((previous) => [...previous, mission.id])
    setPoints((previous) => previous + mission.points)
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

    const { error } = await supabase.auth.updateUser({
      password: authPassword,
    })

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

  const selectedCard = lastResult ? cardsById.get(lastResult.cardId) ?? null : null
  const signInLabel = session ? t('auth.currentUser', { name: getDisplayName(session, locale) }) : t('auth.loginButton')
  const shareButtonLabel = copied ? t('shareCard.done') : t('shareCard.button')

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
            {themeOptions.map((option) => (
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

      <section className="heroSection">
        <article className="heroCard">
          <span className="eyebrow">{t('hero.badge')}</span>
          <h1>{t('hero.title')}</h1>
          <p className="heroText">{t('hero.description')}</p>

          <div className="heroActions">
            <button
              type="button"
              className="primaryButton"
              onClick={() => battleRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('actions.start')}
            </button>
            <button type="button" className="secondaryButton" onClick={handleCopy}>
              {copied ? t('actions.copied') : t('actions.copy')}
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
              <strong>{shareRate}</strong>
              <small>{t('stats.shareNote')}</small>
            </div>
          </div>
        </article>

        <aside className="heroSideCard">
          <div className="miniTitleRow">
            <div>
              <h2>{t('today.title')}</h2>
              <p className="supportText">{t('today.subtitle')}</p>
            </div>
          </div>

          <div className="topicList">
            {hotTopics.map((topic) => {
              const leadingSide = topic.card.left.votes >= topic.card.right.votes ? topic.card.left : topic.card.right
              const metricLabel =
                topic.kind === 'votes'
                  ? t('today.votes', { value: formatNumber(locale, getEstimatedVotes(topic.card)) })
                  : topic.kind === 'thinking'
                    ? t('today.thinkTime', { value: getEstimatedThinkTime(topic.card) })
                    : t('today.spread', { value: getVoteSpread(topic.card) })
              const topicLabel =
                topic.kind === 'votes'
                  ? t('today.voteLeader')
                  : topic.kind === 'thinking'
                    ? t('today.thinkLeader')
                    : t('today.landslideLeader')

              return (
                <button key={topic.kind} type="button" className="topicCard" onClick={() => jumpToCard(topic.card)}>
                  <span className="metaChip">{topicLabel}</span>
                  <strong>{topic.card.prompt}</strong>
                  <span className="topicMeta">
                    {t(`rooms.${topic.card.room}`)} · {metricLabel}
                  </span>
                  <span className="topicResult">
                    {leadingSide.label} · {leadingSide.votes}%
                  </span>
                  <span className="topicLink">{t('today.jump')}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="secondaryButton fullWidth"
            onClick={() => {
              if (hotTopics[0]) {
                jumpToCard(hotTopics[0].card)
              }
            }}
          >
            {t('today.more')}
          </button>
        </aside>
      </section>

      <nav className="roomRail" aria-label={locale === 'ko' ? '방 선택' : 'Room selector'}>
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
                <span>{t('battle.next')}</span>
              </div>
            </>
          ) : (
            <p className="emptyState">{t('latest.empty')}</p>
          )}
        </article>

        <aside className="sideColumn">
          <section className="sideCard profileCard">
            <div className="miniTitleRow">
              <div>
                <h3>{t('profile.title')}</h3>
                <p className="supportText">{t('profile.subtitle')}</p>
              </div>
              <span className="metaChip">Lv. {level}</span>
            </div>

            <div className="pointHero">
              <div>
                <span>{t('profile.points')}</span>
                <strong>{formatNumber(locale, points)}</strong>
              </div>
              <div>
                <span>{t('profile.currentBadge')}</span>
                <strong>{currentBadge.name}</strong>
              </div>
            </div>

            <p className="supportText">{currentBadge.summary}</p>

            <div className="progressTrack">
              <div className="progressFill" style={{ width: `${badgeProgressPercent}%` }} />
            </div>

            {nextBadge ? (
              <div className="progressMeta">
                <span>{t('profile.nextBadge')}</span>
                <strong>{nextBadge.name}</strong>
                <span>
                  {t('profile.progress', {
                    current: formatNumber(locale, points),
                    goal: formatNumber(locale, nextBadge.threshold),
                  })}
                </span>
              </div>
            ) : (
              <div className="progressMeta">
                <span>{t('profile.nextBadge')}</span>
                <strong>{currentBadge.name}</strong>
                <span>100%</span>
              </div>
            )}

            <div className="stackList">
              <div className="stackRow">
                <span className="stackLabel">{t('profile.streak')}</span>
                <strong>{streak}</strong>
              </div>
              <div className="stackRow">
                <span className="stackLabel">{t('profile.sparks')}</span>
                <strong>{formatNumber(locale, sparks)}</strong>
              </div>
            </div>

            <div className="badgeGroup">
              <span className="stackLabel">{t('profile.badges')}</span>
              <div className="badgeList">
                {unlockedBadges.map((badge) => (
                  <span key={badge.id} className="badgeChip">
                    {badge.name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="sideCard">
            <div className="miniTitleRow">
              <div>
                <h3>{t('missions.title')}</h3>
                <p className="supportText">{t('missions.subtitle')}</p>
              </div>
            </div>

            <div className="missionList">
              {missions.map((mission) => {
                const progressPercent = Math.min(100, Math.round((mission.current / mission.goal) * 100))

                return (
                  <div key={mission.id} className="missionRow missionRowExpanded">
                    <div className="missionText">
                      <strong>{mission.label}</strong>
                      <span>{mission.reward}</span>
                    </div>
                    <div className="progressTrack">
                      <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="missionFooter">
                      <span>
                        {mission.current} / {mission.goal}
                      </span>
                      <button
                        type="button"
                        className={`secondaryButton missionButton ${mission.claimable ? 'ready' : ''}`}
                        onClick={() => handleClaimMission(mission)}
                        disabled={!mission.claimable}
                      >
                        {mission.claimed ? t('missions.claimed') : mission.claimable ? t('missions.claim') : t('missions.locked')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </section>

      <section className="insightGrid">
        <article className="surfaceCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('latest.title')}</h3>
              <p className="supportText">{t('latest.subtitle')}</p>
            </div>
          </div>

          {lastResult && selectedCard ? (
            <div className="resultWrap">
              <p className="resultHeadline">{lastResult.matched ? t('latest.matched') : t('latest.minority')}</p>

              <div className="voteBars">
                <div className="voteBarRow">
                  <span>{selectedCard.left.label}</span>
                  <div className="voteBarTrack">
                    <div
                      className={`voteBar hot ${lastResult.selectedSide === 'left' ? 'active' : ''}`}
                      style={{ width: `${selectedCard.left.votes}%` }}
                    />
                  </div>
                  <strong>{selectedCard.left.votes}%</strong>
                </div>

                <div className="voteBarRow">
                  <span>{selectedCard.right.label}</span>
                  <div className="voteBarTrack">
                    <div
                      className={`voteBar cool ${lastResult.selectedSide === 'right' ? 'active' : ''}`}
                      style={{ width: `${selectedCard.right.votes}%` }}
                    />
                  </div>
                  <strong>{selectedCard.right.votes}%</strong>
                </div>
              </div>

              <div className="resultMeta">
                <span>{t('latest.saved', { room: t(`rooms.${selectedCard.room}`) })}</span>
                <strong>+{lastResult.xpGain} XP</strong>
              </div>
            </div>
          ) : (
            <p className="emptyState">{t('latest.empty')}</p>
          )}
        </article>

        <article className="surfaceCard accentCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('shareCard.title')}</h3>
              <p className="supportText">{t('shareCard.subtitle')}</p>
            </div>
          </div>
          <p className="sharePreview">{shareText}</p>
          <button type="button" className="primaryButton fullWidth" onClick={handleCopy}>
            {shareButtonLabel}
          </button>
        </article>

        <article className="surfaceCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('feed.title')}</h3>
              <p className="supportText">{t('feed.subtitle')}</p>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="historyList">
              {history.map((result) => {
                const card = cardsById.get(result.cardId)
                if (!card) {
                  return null
                }

                return (
                  <div key={result.playedAt} className="historyItem">
                    <strong>{card.prompt}</strong>
                    <p>{result.matched ? t('feed.match') : t('feed.minority')}</p>
                    <span>{t(`rooms.${result.room}`)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="emptyState">{t('feed.empty')}</p>
          )}
        </article>

        <article className="surfaceCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('community.title')}</h3>
              <p className="supportText">{t('community.subtitle')}</p>
            </div>
          </div>

          <div className="commentList">
            {roomComments.slice(0, 4).map((comment) => (
              <div key={comment.id} className="commentItem">
                <div className="commentMeta">
                  <strong>{comment.name}</strong>
                  <span>{t('community.likes', { value: formatNumber(locale, comment.likes) })}</span>
                </div>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surfaceCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('ranking.title')}</h3>
              <p className="supportText">{t('ranking.subtitle')}</p>
            </div>
          </div>

          <div className="leaderList">
            {leaderboard.map((entry, index) => (
              <div key={`${entry.name}-${index}`} className="leaderRow">
                <span className="rank">{index + 1}</span>
                <div>
                  <strong>{entry.name}</strong>
                  <small>{entry.title}</small>
                </div>
                <strong>{entry.streak}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="surfaceCard">
          <div className="miniTitleRow">
            <div>
              <h3>{t('unlocks.title')}</h3>
              <p className="supportText">{t('unlocks.subtitle')}</p>
            </div>
          </div>

          <div className="rewardList">
            {rewards.map((reward) => (
              <div key={reward} className="rewardItem">
                <strong>{reward}</strong>
                <span>{formatNumber(locale, sparks)} SP</span>
              </div>
            ))}
          </div>
        </article>
      </section>

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
