import type { BattleCard, CommentEntry, LeaderboardEntry, MissionCopy, Room } from '../types'

type TranslationShape = {
  brand: {
    name: string
    tagline: string
  }
  system: {
    language: string
    dbReady: string
    dbLocal: string
    dbSyncing: string
  }
  actions: {
    invite: string
    start: string
    copy: string
    copied: string
  }
  hero: {
    badge: string
    title: string
    description: string
  }
  stats: {
    liveLabel: string
    liveNote: string
    sessionLabel: string
    sessionValue: string
    sessionNote: string
    shareLabel: string
    shareNote: string
  }
  today: {
    title: string
    subtitle: string
    voteLeader: string
    thinkLeader: string
    landslideLeader: string
    votes: string
    thinkTime: string
    spread: string
    more: string
    jump: string
  }
  profile: {
    title: string
    subtitle: string
    points: string
    currentBadge: string
    nextBadge: string
    progress: string
    badges: string
    streak: string
    sparks: string
  }
  rooms: Record<Room, string>
  battle: {
    votes: string
    hiddenVotes: string
    next: string
    compare: string
  }
  missions: {
    title: string
    subtitle: string
    claim: string
    claimed: string
    locked: string
    items: MissionCopy[]
  }
  unlocks: {
    title: string
    subtitle: string
  }
  latest: {
    title: string
    subtitle: string
    empty: string
    matched: string
    minority: string
    saved: string
  }
  ranking: {
    title: string
    subtitle: string
  }
  feed: {
    title: string
    subtitle: string
    empty: string
    match: string
    minority: string
  }
  community: {
    title: string
    subtitle: string
    likes: string
    items: CommentEntry[]
  }
  auth: {
    loginButton: string
    title: string
    subtitle: string
    modalTitle: string
    modalSubtitle: string
    checking: string
    loginToVote: string
    signInTab: string
    signUpTab: string
    forgotTab: string
    resetTab: string
    nameLabel: string
    emailLabel: string
    verificationCodeLabel: string
    passwordLabel: string
    passwordConfirmLabel: string
    namePlaceholder: string
    emailPlaceholder: string
    verificationCodePlaceholder: string
    passwordPlaceholder: string
    passwordConfirmPlaceholder: string
    randomNickname: string
    sendVerification: string
    verifyEmail: string
    signInSubmit: string
    signUpSubmit: string
    forgotSubmit: string
    resetSubmit: string
    switchToSignIn: string
    switchToSignUp: string
    forgotPassword: string
    backToLogin: string
    fillAll: string
    passwordMismatch: string
    verificationSent: string
    verificationDone: string
    resetSent: string
    checkEmail: string
    passwordHint: string
    passwordUpdated: string
    signOut: string
    currentUser: string
    setupNeeded: string
    secureNote: string
    close: string
  }
  shareCard: {
    title: string
    subtitle: string
    defaultText: string
    button: string
    done: string
    resultText: string
  }
  cards: BattleCard[]
  leaderboard: LeaderboardEntry[]
  rewards: string[]
}

const koCards: BattleCard[] = [
  {
    id: 'weekend-escape',
    room: 'Weekend',
    prompt: '갑자기 오늘 밤 6시간이 비었다. 뭐부터 할래?',
    context: '바로 고르고 다음 카드로 넘겨보세요.',
    heat: '지금 핫함',
    comments: '댓글 18.2k',
    left: { label: '친구한테 연락', detail: '밖에 나가고 싶다', votes: 61 },
    right: { label: '집에서 충전', detail: '오늘은 쉬고 싶다', votes: 39 },
  },
  {
    id: 'brunch-plan',
    room: 'Weekend',
    prompt: '브런치 약속 취소됐다. 남은 오전은?',
    context: '주말 카드라서 가볍게 넘기기 좋아요.',
    heat: '주말 인기',
    comments: '댓글 4.9k',
    left: { label: '산책 + 카페', detail: '기분 전환', votes: 54 },
    right: { label: '침대 + 이불', detail: '이게 진짜 휴식', votes: 46 },
  },
  {
    id: 'weekend-outfit',
    room: 'Weekend',
    prompt: '주말 약속룩, 더 자주 고르는 건?',
    context: '익숙한 고민이라 바로 눌러보게 돼요.',
    heat: '공감 많음',
    comments: '댓글 7.3k',
    left: { label: '편한 맨투맨', detail: '무조건 편해야 함', votes: 58 },
    right: { label: '꾸민 룩', detail: '약속이면 좀 꾸민다', votes: 42 },
  },
  {
    id: 'lazy-sunday',
    room: 'Weekend',
    prompt: '일요일 오후, 제일 좋은 시간은?',
    context: '딱 1초 고민하게 만드는 카드예요.',
    heat: '저장 많음',
    comments: '댓글 5.1k',
    left: { label: '낮잠 시간', detail: '조용히 쉬는 게 최고', votes: 47 },
    right: { label: '밖에서 걷기', detail: '집에만 있긴 아쉽다', votes: 53 },
  },
  {
    id: 'late-night-call',
    room: 'Weekend',
    prompt: '자기 전에 더 반가운 연락은?',
    context: '친구랑 바로 공유하기 좋은 카드예요.',
    heat: '친구 소환',
    comments: '댓글 8.0k',
    left: { label: '지금 뭐해?', detail: '가볍게 이어지는 대화', votes: 45 },
    right: { label: '오늘 잘 들어갔어?', detail: '챙겨주는 느낌이 좋다', votes: 55 },
  },
  {
    id: 'sunday-reset',
    room: 'Weekend',
    prompt: '월요일 덜 힘든 주말 마무리는?',
    context: '주말 끝날 때 다들 고민하는 주제예요.',
    heat: '주말 마감',
    comments: '댓글 6.4k',
    left: { label: '집 정리', detail: '정리하면 마음도 편함', votes: 41 },
    right: { label: '일찍 자기', detail: '잠이 제일 중요함', votes: 59 },
  },
  {
    id: 'office-credit',
    room: 'Work',
    prompt: '팀플에서 진짜 고마운 사람은?',
    context: '회사 얘기는 다들 할 말이 많아요.',
    heat: '회사 밈',
    comments: '댓글 9.4k',
    left: { label: '마감 지키는 사람', detail: '끝까지 끌고 간다', votes: 68 },
    right: { label: '아이디어 내는 사람', detail: '분위기를 살린다', votes: 32 },
  },
  {
    id: 'lunch-tribe',
    room: 'Work',
    prompt: '회사 점심 메이트로 최고는?',
    context: '짧게 고르고 공감하기 좋아요.',
    heat: '점심 인기',
    comments: '댓글 11.0k',
    left: { label: '맛집 잘 아는 사람', detail: '하루가 좋아진다', votes: 49 },
    right: { label: '메뉴 바로 고르는 사람', detail: '결정 빨라서 좋다', votes: 51 },
  },
  {
    id: 'meeting-mode',
    room: 'Work',
    prompt: '회의 때 더 믿음 가는 사람은?',
    context: '딱 회사에서 많이 나오는 얘기예요.',
    heat: '직장인 공감',
    comments: '댓글 7.9k',
    left: { label: '정리 잘하는 사람', detail: '회의 끝나면 딱 남는다', votes: 56 },
    right: { label: '핵심만 말하는 사람', detail: '시간을 안 잡아먹는다', votes: 44 },
  },
  {
    id: 'commute-mood',
    room: 'Work',
    prompt: '출근길 필수템은?',
    context: '아침마다 바로 떠오르는 카드예요.',
    heat: '출근길 인기',
    comments: '댓글 6.1k',
    left: { label: '이어폰', detail: '혼자만의 모드가 필요함', votes: 62 },
    right: { label: '커피', detail: '이거 없으면 시작 못 함', votes: 38 },
  },
  {
    id: 'overtime-choice',
    room: 'Work',
    prompt: '야근할 때 진짜 필요한 건?',
    context: '짧지만 의견이 갈리는 카드예요.',
    heat: '야근 토론',
    comments: '댓글 5.6k',
    left: { label: '간식', detail: '배고프면 집중이 안 됨', votes: 43 },
    right: { label: '조용한 자리', detail: '환경이 제일 중요함', votes: 57 },
  },
  {
    id: 'team-chat',
    room: 'Work',
    prompt: '단톡방에서 최고인 사람은?',
    context: '업무도 중요하지만 분위기도 중요해요.',
    heat: '단톡 필수',
    comments: '댓글 4.7k',
    left: { label: '공지 바로 올리는 사람', detail: '정리가 잘 된다', votes: 52 },
    right: { label: '웃긴 짤 올리는 사람', detail: '분위기가 산다', votes: 48 },
  },
  {
    id: 'ramen-upgrade',
    room: 'Food',
    prompt: '라면에 딱 하나만 넣을 수 있다면?',
    context: '짧지만 절대 안 끝나는 주제예요.',
    heat: '야식 1위',
    comments: '댓글 23.1k',
    left: { label: '반숙 계란', detail: '무조건 맛있다', votes: 57 },
    right: { label: '치즈 한 장', detail: '진한 맛이 좋다', votes: 43 },
  },
  {
    id: 'dessert-vote',
    room: 'Food',
    prompt: '디저트 하나만 고르면?',
    context: '가볍게 눌렀다가 계속 보게 되는 카드예요.',
    heat: '당 충전',
    comments: '댓글 12.3k',
    left: { label: '아이스크림', detail: '시원한 게 최고', votes: 48 },
    right: { label: '케이크', detail: '한 조각의 만족감', votes: 52 },
  },
  {
    id: 'coffee-order',
    room: 'Food',
    prompt: '카페에서 제일 자주 시키는 건?',
    context: '익숙해서 바로 고르게 돼요.',
    heat: '카페 인기',
    comments: '댓글 10.2k',
    left: { label: '아아', detail: '기본은 이거', votes: 64 },
    right: { label: '라떼', detail: '부드러운 게 좋다', votes: 36 },
  },
  {
    id: 'late-night-snack',
    room: 'Food',
    prompt: '야식으로 더 끌리는 건?',
    context: '밤에 특히 잘 터지는 카드예요.',
    heat: '야식 배틀',
    comments: '댓글 19.8k',
    left: { label: '치킨', detail: '실패 없는 선택', votes: 59 },
    right: { label: '떡볶이', detail: '맵고 자극적이라 좋다', votes: 41 },
  },
  {
    id: 'delivery-choice',
    room: 'Food',
    prompt: '배달 시킬 때 더 중요한 건?',
    context: '짧지만 취향이 갈려요.',
    heat: '배달 필수',
    comments: '댓글 7.1k',
    left: { label: '리뷰', detail: '후기 보고 고른다', votes: 46 },
    right: { label: '배달 속도', detail: '빨리 오는 게 중요', votes: 54 },
  },
  {
    id: 'spicy-level',
    room: 'Food',
    prompt: '매운맛 고를 때 나는?',
    context: '친구끼리 놀리기 좋은 카드예요.',
    heat: '맵부심',
    comments: '댓글 8.8k',
    left: { label: '보통맛', detail: '맛있게 먹는 게 중요', votes: 44 },
    right: { label: '제일 매운맛', detail: '매워야 먹은 느낌', votes: 56 },
  },
  {
    id: 'travel-mode',
    room: 'Travel',
    prompt: '여행 전날 밤, 내 책상은?',
    context: '친구 태그가 잘 붙는 카드예요.',
    heat: '친구 소환',
    comments: '댓글 6.7k',
    left: { label: '동선표까지 다 짬', detail: '계획이 편하다', votes: 44 },
    right: { label: '숙소만 잡고 끝', detail: '가서 정한다', votes: 56 },
  },
  {
    id: 'airport-rush',
    room: 'Travel',
    prompt: '공항에 너무 일찍 왔다. 뭐부터 해?',
    context: '짧고 익숙한 상황이라 바로 반응하게 돼요.',
    heat: '공감 폭주',
    comments: '댓글 8.1k',
    left: { label: '면세점 한 바퀴', detail: '이미 여행 시작', votes: 34 },
    right: { label: '카페 자리 잡기', detail: '조용히 쉬고 싶다', votes: 66 },
  },
  {
    id: 'window-seat',
    room: 'Travel',
    prompt: '비행기 자리 고를 수 있으면?',
    context: '여행 좋아하는 사람들 반응이 빨라요.',
    heat: '자리 취향',
    comments: '댓글 9.1k',
    left: { label: '창가', detail: '뷰 보는 재미가 있다', votes: 58 },
    right: { label: '복도', detail: '편하게 움직일 수 있다', votes: 42 },
  },
  {
    id: 'hotel-plan',
    room: 'Travel',
    prompt: '숙소에서 더 중요한 건?',
    context: '여행 갈 때 늘 나오는 얘기예요.',
    heat: '숙소 고민',
    comments: '댓글 5.5k',
    left: { label: '위치', detail: '이동이 편해야 한다', votes: 63 },
    right: { label: '뷰', detail: '사진이 잘 나와야 한다', votes: 37 },
  },
  {
    id: 'souvenir-pick',
    room: 'Travel',
    prompt: '여행 선물로 더 많이 사는 건?',
    context: '누구나 한 번쯤 겪는 고민이에요.',
    heat: '선물 고민',
    comments: '댓글 4.8k',
    left: { label: '먹을 것', detail: '실용적이라 좋다', votes: 61 },
    right: { label: '굿즈', detail: '남는 건 결국 이런 것', votes: 39 },
  },
  {
    id: 'travel-buddy',
    room: 'Travel',
    prompt: '여행 메이트로 더 좋은 사람은?',
    context: '친구 태그율이 높은 카드예요.',
    heat: '메이트 투표',
    comments: '댓글 7.6k',
    left: { label: '계획 잘 짜는 사람', detail: '안 헤맨다', votes: 51 },
    right: { label: '텐션 좋은 사람', detail: '분위기가 산다', votes: 49 },
  },
  {
    id: 'dating-text',
    room: 'Dating',
    prompt: '썸할 때 더 설레는 말은?',
    context: '연애 룸은 다시 오는 비율이 높아요.',
    heat: '저장 급상승',
    comments: '댓글 15.5k',
    left: { label: '집 가면 말해', detail: '챙겨주는 느낌', votes: 63 },
    right: { label: '네 생각나서 연락했어', detail: '직진이 좋다', votes: 37 },
  },
  {
    id: 'first-date-place',
    room: 'Dating',
    prompt: '첫 데이트 장소로 더 무난한 건?',
    context: '다들 한 번쯤 고민했던 카드예요.',
    heat: '첫 데이트',
    comments: '댓글 11.7k',
    left: { label: '카페', detail: '부담이 덜하다', votes: 55 },
    right: { label: '맛집', detail: '먹으면서 대화가 편하다', votes: 45 },
  },
  {
    id: 'reply-speed',
    room: 'Dating',
    prompt: '연락 텀은 어느 쪽이 더 좋음?',
    context: '짧고 자주 눌리는 카드예요.',
    heat: '연락 텀',
    comments: '댓글 13.0k',
    left: { label: '바로 답장', detail: '기다리게 안 해서 좋다', votes: 52 },
    right: { label: '여유 있게', detail: '부담이 덜하다', votes: 48 },
  },
  {
    id: 'gift-choice',
    room: 'Dating',
    prompt: '작은 선물로 더 설레는 건?',
    context: '연애 카드 중 저장률이 높아요.',
    heat: '설렘 포인트',
    comments: '댓글 9.8k',
    left: { label: '내가 좋아하던 거', detail: '기억해준 게 좋다', votes: 67 },
    right: { label: '손편지', detail: '정성이 느껴진다', votes: 33 },
  },
  {
    id: 'couple-photo',
    room: 'Dating',
    prompt: '둘이 사진 찍을 때 더 많은 사람은?',
    context: '가볍게 웃으면서 누르기 좋아요.',
    heat: '커플 공감',
    comments: '댓글 6.9k',
    left: { label: '내가 먼저', detail: '기록 남기는 걸 좋아함', votes: 41 },
    right: { label: '상대가 먼저', detail: '나보다 더 잘 챙긴다', votes: 59 },
  },
  {
    id: 'confession-style',
    room: 'Dating',
    prompt: '고백은 어느 쪽이 더 좋음?',
    context: '연애방에서 오래 머무는 카드예요.',
    heat: '고백 취향',
    comments: '댓글 14.2k',
    left: { label: '직접 말하기', detail: '눈 보고 말해야 함', votes: 72 },
    right: { label: '문자나 전화', detail: '덜 떨리고 솔직해짐', votes: 28 },
  },
]

const enCards: BattleCard[] = [
  {
    id: 'weekend-escape',
    room: 'Weekend',
    prompt: 'Tonight suddenly opened up. What do you do first?',
    context: 'Pick fast and move to the next card.',
    heat: 'Hot right now',
    comments: '18.2k replies',
    left: { label: 'Text the group', detail: 'I want to go out', votes: 61 },
    right: { label: 'Stay home and recharge', detail: 'I want a quiet night', votes: 39 },
  },
  {
    id: 'brunch-plan',
    room: 'Weekend',
    prompt: 'Brunch got canceled. What takes over the morning?',
    context: 'Easy weekend card. Quick to answer.',
    heat: 'Weekend favorite',
    comments: '4.9k replies',
    left: { label: 'Walk and cafe', detail: 'I need a mood reset', votes: 54 },
    right: { label: 'Bed and blanket', detail: 'This is real rest', votes: 46 },
  },
  {
    id: 'weekend-outfit',
    room: 'Weekend',
    prompt: 'For a weekend hangout, what do you pick more often?',
    context: 'It feels familiar, so people react fast.',
    heat: 'Very relatable',
    comments: '7.3k replies',
    left: { label: 'Comfy sweatshirt', detail: 'Comfort wins first', votes: 58 },
    right: { label: 'More dressed up look', detail: 'I still want to look ready', votes: 42 },
  },
  {
    id: 'lazy-sunday',
    room: 'Weekend',
    prompt: 'Best part of a Sunday afternoon?',
    context: 'This one makes people pause for one second.',
    heat: 'Saved a lot',
    comments: '5.1k replies',
    left: { label: 'Nap time', detail: 'Quiet rest is the best', votes: 47 },
    right: { label: 'A walk outside', detail: 'I cannot stay in all day', votes: 53 },
  },
  {
    id: 'late-night-call',
    room: 'Weekend',
    prompt: 'Which late-night text feels better?',
    context: 'Easy to send to a friend right away.',
    heat: 'Tag a friend',
    comments: '8.0k replies',
    left: { label: 'What are you doing?', detail: 'Light and easy to keep talking', votes: 45 },
    right: { label: 'Did you get home safe?', detail: 'Feels caring', votes: 55 },
  },
  {
    id: 'sunday-reset',
    room: 'Weekend',
    prompt: 'What makes Monday hurt less?',
    context: 'Everyone thinks about this on Sunday night.',
    heat: 'Weekend reset',
    comments: '6.4k replies',
    left: { label: 'Clean the room', detail: 'A clean space helps', votes: 41 },
    right: { label: 'Sleep early', detail: 'Sleep matters more', votes: 59 },
  },
  {
    id: 'office-credit',
    room: 'Work',
    prompt: 'Who is the real hero in a team project?',
    context: 'Work cards always get strong opinions.',
    heat: 'Office meme',
    comments: '9.4k replies',
    left: { label: 'The deadline keeper', detail: 'They get it done', votes: 68 },
    right: { label: 'The idea person', detail: 'They lift the mood', votes: 32 },
  },
  {
    id: 'lunch-tribe',
    room: 'Work',
    prompt: 'Best lunch buddy at work?',
    context: 'Fast to pick. Easy to relate to.',
    heat: 'Lunch favorite',
    comments: '11.0k replies',
    left: { label: 'Knows great food spots', detail: 'Makes the day better', votes: 49 },
    right: { label: 'Picks the menu fast', detail: 'No decision pain', votes: 51 },
  },
  {
    id: 'meeting-mode',
    room: 'Work',
    prompt: 'Who feels more reliable in a meeting?',
    context: 'This comes up at work all the time.',
    heat: 'Work life',
    comments: '7.9k replies',
    left: { label: 'The person who summarizes well', detail: 'You know what is left after', votes: 56 },
    right: { label: 'The person who says the point fast', detail: 'Saves time', votes: 44 },
  },
  {
    id: 'commute-mood',
    room: 'Work',
    prompt: 'Your must-have on the way to work?',
    context: 'A very instant morning answer.',
    heat: 'Commute mode',
    comments: '6.1k replies',
    left: { label: 'Earbuds', detail: 'I need my own zone', votes: 62 },
    right: { label: 'Coffee', detail: 'I cannot start without it', votes: 38 },
  },
  {
    id: 'overtime-choice',
    room: 'Work',
    prompt: 'What really helps during overtime?',
    context: 'Short card, split opinions.',
    heat: 'Late work talk',
    comments: '5.6k replies',
    left: { label: 'Snacks', detail: 'I cannot focus when hungry', votes: 43 },
    right: { label: 'A quiet seat', detail: 'The space matters most', votes: 57 },
  },
  {
    id: 'team-chat',
    room: 'Work',
    prompt: 'Best person in the team group chat?',
    context: 'Work matters, but so does the vibe.',
    heat: 'Group chat pick',
    comments: '4.7k replies',
    left: { label: 'Posts updates fast', detail: 'Keeps things organized', votes: 52 },
    right: { label: 'Drops funny memes', detail: 'Keeps the mood alive', votes: 48 },
  },
  {
    id: 'ramen-upgrade',
    room: 'Food',
    prompt: 'You can add one thing to ramen. What wins?',
    context: 'Short card. Never-ending debate.',
    heat: 'Late-night No.1',
    comments: '23.1k replies',
    left: { label: 'Soft egg', detail: 'Always tastes good', votes: 57 },
    right: { label: 'One slice of cheese', detail: 'I like a richer bite', votes: 43 },
  },
  {
    id: 'dessert-vote',
    room: 'Food',
    prompt: 'If you can choose one dessert only?',
    context: 'People tap this and keep going.',
    heat: 'Sugar boost',
    comments: '12.3k replies',
    left: { label: 'Ice cream', detail: 'Cold wins', votes: 48 },
    right: { label: 'Cake', detail: 'One slice is enough joy', votes: 52 },
  },
  {
    id: 'coffee-order',
    room: 'Food',
    prompt: 'Most common cafe order for you?',
    context: 'A familiar everyday pick.',
    heat: 'Cafe favorite',
    comments: '10.2k replies',
    left: { label: 'Iced americano', detail: 'The default choice', votes: 64 },
    right: { label: 'Latte', detail: 'I like it softer', votes: 36 },
  },
  {
    id: 'late-night-snack',
    room: 'Food',
    prompt: 'What sounds better for late-night food?',
    context: 'This one gets louder at night.',
    heat: 'Late-night battle',
    comments: '19.8k replies',
    left: { label: 'Fried chicken', detail: 'Safe and classic', votes: 59 },
    right: { label: 'Tteokbokki', detail: 'Spicy hits harder', votes: 41 },
  },
  {
    id: 'delivery-choice',
    room: 'Food',
    prompt: 'What matters more in delivery?',
    context: 'Short card, clear split.',
    heat: 'Delivery rule',
    comments: '7.1k replies',
    left: { label: 'Reviews', detail: 'I check feedback first', votes: 46 },
    right: { label: 'Delivery speed', detail: 'Fast is better', votes: 54 },
  },
  {
    id: 'spicy-level',
    room: 'Food',
    prompt: 'When you pick a spicy level, you go for?',
    context: 'Great for teasing friends.',
    heat: 'Spicy pride',
    comments: '8.8k replies',
    left: { label: 'Regular spicy', detail: 'Taste matters first', votes: 44 },
    right: { label: 'The hottest one', detail: 'It has to feel spicy', votes: 56 },
  },
  {
    id: 'travel-mode',
    room: 'Travel',
    prompt: 'The night before a trip, your desk looks like?',
    context: 'A tag-a-friend style card.',
    heat: 'Friend summon',
    comments: '6.7k replies',
    left: { label: 'Full route plan ready', detail: 'Planning feels easier', votes: 44 },
    right: { label: 'Only hotel booked', detail: 'I decide there', votes: 56 },
  },
  {
    id: 'airport-rush',
    room: 'Travel',
    prompt: 'You got to the airport way too early. First move?',
    context: 'Simple situation. Instant reaction.',
    heat: 'Very relatable',
    comments: '8.1k replies',
    left: { label: 'Duty free lap', detail: 'Trip already started', votes: 34 },
    right: { label: 'Find a cafe seat', detail: 'I want quiet time', votes: 66 },
  },
  {
    id: 'window-seat',
    room: 'Travel',
    prompt: 'If you can pick your plane seat?',
    context: 'Travel fans react fast to this one.',
    heat: 'Seat taste',
    comments: '9.1k replies',
    left: { label: 'Window seat', detail: 'The view matters', votes: 58 },
    right: { label: 'Aisle seat', detail: 'Easy movement wins', votes: 42 },
  },
  {
    id: 'hotel-plan',
    room: 'Travel',
    prompt: 'What matters more in a hotel?',
    context: 'A classic travel debate.',
    heat: 'Hotel talk',
    comments: '5.5k replies',
    left: { label: 'Location', detail: 'Moving around should be easy', votes: 63 },
    right: { label: 'View', detail: 'The room should look good too', votes: 37 },
  },
  {
    id: 'souvenir-pick',
    room: 'Travel',
    prompt: 'What do you buy more often as a travel gift?',
    context: 'Almost everyone has done this.',
    heat: 'Gift pick',
    comments: '4.8k replies',
    left: { label: 'Food', detail: 'Feels practical', votes: 61 },
    right: { label: 'Goods', detail: 'This is what stays', votes: 39 },
  },
  {
    id: 'travel-buddy',
    room: 'Travel',
    prompt: 'Better travel buddy?',
    context: 'This one gets tagged into group chats.',
    heat: 'Buddy vote',
    comments: '7.6k replies',
    left: { label: 'Good planner', detail: 'Less getting lost', votes: 51 },
    right: { label: 'High-energy friend', detail: 'The vibe stays up', votes: 49 },
  },
  {
    id: 'dating-text',
    room: 'Dating',
    prompt: 'Which text feels more exciting in the early stage?',
    context: 'Dating room gets strong return visits.',
    heat: 'Saved a lot',
    comments: '15.5k replies',
    left: { label: 'Text me when you get home', detail: 'Feels caring', votes: 63 },
    right: { label: 'You crossed my mind', detail: 'Direct feels nice', votes: 37 },
  },
  {
    id: 'first-date-place',
    room: 'Dating',
    prompt: 'Safer first-date place?',
    context: 'Almost everyone has thought about this one.',
    heat: 'First date',
    comments: '11.7k replies',
    left: { label: 'Cafe', detail: 'Less pressure', votes: 55 },
    right: { label: 'Good restaurant', detail: 'Easier to talk over food', votes: 45 },
  },
  {
    id: 'reply-speed',
    room: 'Dating',
    prompt: 'Which reply pace feels better?',
    context: 'Small card. Big opinions.',
    heat: 'Reply speed',
    comments: '13.0k replies',
    left: { label: 'Fast reply', detail: 'Feels clear', votes: 52 },
    right: { label: 'A little later', detail: 'Feels less heavy', votes: 48 },
  },
  {
    id: 'gift-choice',
    room: 'Dating',
    prompt: 'Which small gift feels more special?',
    context: 'One of the higher save-rate cards.',
    heat: 'Sweet point',
    comments: '9.8k replies',
    left: { label: 'Something I like', detail: 'They remembered me', votes: 67 },
    right: { label: 'A handwritten note', detail: 'Feels sincere', votes: 33 },
  },
  {
    id: 'couple-photo',
    room: 'Dating',
    prompt: 'Who takes more couple photos?',
    context: 'Light card, easy laughs.',
    heat: 'Couple vibe',
    comments: '6.9k replies',
    left: { label: 'Me first', detail: 'I like to keep memories', votes: 41 },
    right: { label: 'Them first', detail: 'They care more about the moment', votes: 59 },
  },
  {
    id: 'confession-style',
    room: 'Dating',
    prompt: 'Which confession style feels better?',
    context: 'A long-dwell card in the dating room.',
    heat: 'Confession style',
    comments: '14.2k replies',
    left: { label: 'Say it in person', detail: 'Eye contact matters', votes: 72 },
    right: { label: 'Text or call', detail: 'Feels less scary', votes: 28 },
  },
]

const koComments: CommentEntry[] = [
  {
    id: 'comment-weekend-1',
    room: 'Weekend',
    name: '유나',
    text: '주말 카드가 짧아서 계속 누르게 돼요.',
    likes: 128,
  },
  {
    id: 'comment-work-1',
    room: 'Work',
    name: '민호',
    text: '회사 얘기 너무 현실적이라 웃김.',
    likes: 94,
  },
  {
    id: 'comment-food-1',
    room: 'Food',
    name: '서진',
    text: '밥 메뉴 카드에서 진짜 오래 머물렀어요.',
    likes: 152,
  },
  {
    id: 'comment-travel-1',
    room: 'Travel',
    name: '하린',
    text: '여행 취향 비교할 때 친구 태그하고 싶어져요.',
    likes: 87,
  },
  {
    id: 'comment-dating-1',
    room: 'Dating',
    name: '도윤',
    text: '연애방은 대답 보고 바로 공유하게 됨.',
    likes: 171,
  },
]

const koTranslation = {
  brand: {
    name: 'Picksy',
    tagline: '지금 바로 고르는 취향 배틀',
  },
  system: {
    language: '언어',
    dbReady: 'DB 연결됨',
    dbLocal: '로컬 데모',
    dbSyncing: 'DB 불러오는 중',
  },
  actions: {
    invite: '친구 초대',
    start: '바로 시작',
    copy: '공유 문구 복사',
    copied: '복사됨',
  },
  hero: {
    badge: '길게 읽지 말고 바로 고르기',
    title: '지금 사람들 뭐 고르는지 바로 보자',
    description:
      '길게 답하는 테스트 대신, 한 번 탭하고 바로 결과를 보는 방식이에요. 계속 넘기다 보면 기록도 쌓이고 친구랑 비교도 할 수 있어요.',
  },
  stats: {
    liveLabel: '지금 참여중',
    liveNote: '실시간으로 계속 들어와요',
    sessionLabel: '평균 머무는 시간',
    sessionValue: '{{value}}분',
    sessionNote: '짧게 보고 계속 넘기게 돼요',
    shareLabel: '공유율',
    shareNote: '카드 몇 개 보면 더 올라가요',
  },
  today: {
    title: '오늘 기록',
    subtitle: '지금 가장 반응 센 주제',
    voteLeader: '투표량 1위',
    thinkLeader: '오래 고민한 주제',
    landslideLeader: '한쪽 몰림 1위',
    votes: '예상 투표 {{value}}',
    thinkTime: '평균 고민 {{value}}초',
    spread: '{{value}}%p 차이',
    more: '더보기',
    jump: '이 주제로 보기',
  },
  profile: {
    title: '포인트 랩',
    subtitle: '미션 달성하고 뱃지 모으기',
    points: '포인트',
    currentBadge: '현재 뱃지',
    nextBadge: '다음 뱃지',
    progress: '{{current}} / {{goal}} P',
    badges: '획득 뱃지',
    streak: '연속 선택',
    sparks: '스파크',
  },
  rooms: {
    All: '전체',
    Weekend: '주말',
    Work: '회사',
    Food: '음식',
    Travel: '여행',
    Dating: '연애',
  },
  battle: {
    votes: '{{value}}% 선택',
    hiddenVotes: '??',
    next: '고르면 바로 다음 카드가 떠요.',
    compare: '짧게 고르고 바로 비교해요.',
  },
  missions: {
    title: '오늘 미션',
    subtitle: '완료하면 포인트가 쌓여요',
    claim: '받기',
    claimed: '완료',
    locked: '진행 중',
    items: [
      { id: 'daily_flip', label: '카드 3개 보기', reward: '+120 P', points: 120 },
      { id: 'crowd_reader', label: '대세 2번 맞히기', reward: '+160 P', points: 160 },
      { id: 'room_hopper', label: '새 룸 2개 열기', reward: '+140 P', points: 140 },
      { id: 'streak_builder', label: '연속 선택 5번 하기', reward: '+200 P', points: 200 },
    ],
  },
  unlocks: {
    title: '다음 보상',
    subtitle: 'Sparks shop',
  },
  latest: {
    title: '방금 결과',
    subtitle: '바로 확인',
    empty: '카드를 하나 고르면 결과가 바로 보여요.',
    matched: '대세랑 같아요.',
    minority: '소수 선택이에요. 공유하기 더 좋아요.',
    saved: '{{room}} 기록 저장',
  },
  ranking: {
    title: '실시간 랭킹',
    subtitle: '오래 머무는 유저',
  },
  feed: {
    title: '최근 기록',
    subtitle: '내 활동',
    empty: '첫 선택을 하면 여기에 쌓여요.',
    match: '대세 선택',
    minority: '소수 선택',
  },
  community: {
    title: '지금 반응',
    subtitle: '짧고 솔직한 한마디',
    likes: '좋아요 {{value}}',
    items: koComments,
  },
  auth: {
    loginButton: '로그인',
    title: '로그인하고 계속 보기',
    subtitle: '이메일과 비밀번호로 바로 들어오고, 필요하면 비밀번호도 다시 설정할 수 있어요.',
    modalTitle: 'Picksy 계정',
    modalSubtitle: '회원가입부터 비밀번호 찾기까지 한 번에 처리할 수 있어요.',
    checking: '처리 중...',
    loginToVote: '선택하면 로그인 창이 열려요.',
    signInTab: '로그인',
    signUpTab: '회원가입',
    forgotTab: '비밀번호 찾기',
    resetTab: '비밀번호 재설정',
    nameLabel: '닉네임',
    emailLabel: '이메일',
    verificationCodeLabel: '인증번호',
    passwordLabel: '비밀번호',
    passwordConfirmLabel: '비밀번호 확인',
    namePlaceholder: '닉네임을 입력해요',
    emailPlaceholder: '이메일을 입력해요',
    verificationCodePlaceholder: '인증번호를 입력해요',
    passwordPlaceholder: '비밀번호를 입력해요',
    passwordConfirmPlaceholder: '비밀번호를 한 번 더 입력해요',
    randomNickname: '랜덤',
    sendVerification: '인증번호 전송',
    verifyEmail: '인증하기',
    signInSubmit: '로그인',
    signUpSubmit: '회원가입',
    forgotSubmit: '재설정 메일 보내기',
    resetSubmit: '새 비밀번호 저장',
    switchToSignIn: '이미 계정이 있어요',
    switchToSignUp: '처음이에요. 회원가입할래요',
    forgotPassword: '비밀번호를 잊었어요',
    backToLogin: '로그인으로 돌아가기',
    fillAll: '모든 칸을 입력해 주세요.',
    passwordMismatch: '비밀번호가 서로 달라요.',
    verificationSent: '{{email}}로 인증번호를 보냈어요.',
    verificationDone: '이메일 인증이 완료됐어요. 이제 비밀번호를 정하면 돼요.',
    resetSent: '{{email}}로 비밀번호 재설정 메일을 보냈어요.',
    checkEmail: '메일로 온 링크를 열면 새 비밀번호를 설정할 수 있어요.',
    passwordHint: '비밀번호는 8자 이상으로 잡는 걸 추천해요.',
    passwordUpdated: '새 비밀번호가 저장됐어요. 이제 바로 로그인할 수 있어요.',
    signOut: '로그아웃',
    currentUser: '{{name}} 님 접속 중',
    setupNeeded: 'Supabase 키를 연결하면 로그인할 수 있어요.',
    secureNote: '이메일은 로그인에만 쓰고, 화면에는 닉네임만 보여주는 구성이 안전해요.',
    close: '닫기',
  },
  shareCard: {
    title: '공유 카드',
    subtitle: '친구 데려오기',
    defaultText: 'Picksy에서 지금 뭐가 더 많이 선택되는지 같이 보자.',
    button: '문구 복사',
    done: '복사 완료',
    resultText:
      'Picksy에서 "{{label}}" 골랐더니 {{percent}}%가 나랑 같았어. 나 지금 {{streak}}연속 중.',
  },
  cards: koCards,
  leaderboard: [
    { name: 'Mina', title: '취향 고수', streak: 41 },
    { name: 'Jun', title: '예측 잘함', streak: 33 },
    { name: 'Sora', title: '공감 수집가', streak: 29 },
  ],
  rewards: ['친구 비교 카드', '오늘의 방장 배지', '비공개 랭킹 입장권'],
} satisfies TranslationShape

const enComments: CommentEntry[] = [
  {
    id: 'comment-weekend-1',
    room: 'Weekend',
    name: 'Yuna',
    text: 'Weekend cards are short, so I keep tapping.',
    likes: 128,
  },
  {
    id: 'comment-work-1',
    room: 'Work',
    name: 'Minho',
    text: 'The work room feels too real in a funny way.',
    likes: 94,
  },
  {
    id: 'comment-food-1',
    room: 'Food',
    name: 'Seojin',
    text: 'I spent way too long in the food room.',
    likes: 152,
  },
  {
    id: 'comment-travel-1',
    room: 'Travel',
    name: 'Harin',
    text: 'Travel picks make me want to tag my friends.',
    likes: 87,
  },
  {
    id: 'comment-dating-1',
    room: 'Dating',
    name: 'Doyoon',
    text: 'Dating room answers are instantly shareable.',
    likes: 171,
  },
]

const enTranslation = {
  brand: {
    name: 'Picksy',
    tagline: 'quick pick playground',
  },
  system: {
    language: 'language',
    dbReady: 'DB connected',
    dbLocal: 'local demo',
    dbSyncing: 'syncing DB',
  },
  actions: {
    invite: 'Invite friends',
    start: 'Start now',
    copy: 'Copy share text',
    copied: 'Copied',
  },
  hero: {
    badge: 'Skip the long read. Pick right away.',
    title: 'See what people choose right now.',
    description:
      'Instead of a long test, this is one quick tap and instant feedback. Keep flipping and your streak, rewards, and share moments start building.',
  },
  stats: {
    liveLabel: 'Live now',
    liveNote: 'New picks keep coming in',
    sessionLabel: 'Avg. time',
    sessionValue: '{{value}} min',
    sessionNote: 'Short cards keep people moving',
    shareLabel: 'Share rate',
    shareNote: 'It rises after a few cards',
  },
  today: {
    title: 'Today',
    subtitle: 'The hottest topics right now',
    voteLeader: 'Most voted',
    thinkLeader: 'Longest think time',
    landslideLeader: 'Biggest landslide',
    votes: '{{value}} estimated votes',
    thinkTime: '{{value}} sec avg. think time',
    spread: '{{value}} pt spread',
    more: 'See more',
    jump: 'Open this topic',
  },
  profile: {
    title: 'Point Lab',
    subtitle: 'Clear missions and collect badges',
    points: 'Points',
    currentBadge: 'Current badge',
    nextBadge: 'Next badge',
    progress: '{{current}} / {{goal}} P',
    badges: 'Unlocked badges',
    streak: 'Pick streak',
    sparks: 'Sparks',
  },
  rooms: {
    All: 'All',
    Weekend: 'Weekend',
    Work: 'Work',
    Food: 'Food',
    Travel: 'Travel',
    Dating: 'Dating',
  },
  battle: {
    votes: '{{value}}% picked this',
    hiddenVotes: '??',
    next: 'Pick once and the next card appears.',
    compare: 'Fast choice. Instant compare.',
  },
  missions: {
    title: 'Daily goals',
    subtitle: 'Earn points when you clear them',
    claim: 'Claim',
    claimed: 'Claimed',
    locked: 'In progress',
    items: [
      { id: 'daily_flip', label: 'See 3 cards', reward: '+120 P', points: 120 },
      { id: 'crowd_reader', label: 'Match the crowd twice', reward: '+160 P', points: 160 },
      { id: 'room_hopper', label: 'Open 2 new rooms', reward: '+140 P', points: 140 },
      { id: 'streak_builder', label: 'Build a 5-pick streak', reward: '+200 P', points: 200 },
    ],
  },
  unlocks: {
    title: 'Next rewards',
    subtitle: 'Sparks shop',
  },
  latest: {
    title: 'Latest result',
    subtitle: 'Right away',
    empty: 'Pick one card and your result shows up here.',
    matched: 'You matched the crowd.',
    minority: 'You picked the minority side. Great for sharing.',
    saved: '{{room}} saved',
  },
  ranking: {
    title: 'Live ranking',
    subtitle: 'People staying longest',
  },
  feed: {
    title: 'Recent picks',
    subtitle: 'My activity',
    empty: 'Your first pick will show up here.',
    match: 'crowd match',
    minority: 'minority pick',
  },
  community: {
    title: 'Live reactions',
    subtitle: 'Short comments people leave',
    likes: '{{value}} likes',
    items: enComments,
  },
  auth: {
    loginButton: 'Sign in',
    title: 'Sign in to keep going',
    subtitle: 'Use email and password, and recover your password when you need it.',
    modalTitle: 'Picksy account',
    modalSubtitle: 'Sign in, create an account, or recover your password in one place.',
    checking: 'Working...',
    loginToVote: 'Pick a side and we will open sign-in.',
    signInTab: 'Sign in',
    signUpTab: 'Create account',
    forgotTab: 'Forgot password',
    resetTab: 'Reset password',
    nameLabel: 'Nickname',
    emailLabel: 'Email',
    verificationCodeLabel: 'Verification code',
    passwordLabel: 'Password',
    passwordConfirmLabel: 'Confirm password',
    namePlaceholder: 'Pick a nickname',
    emailPlaceholder: 'Enter your email',
    verificationCodePlaceholder: 'Enter the code',
    passwordPlaceholder: 'Enter your password',
    passwordConfirmPlaceholder: 'Enter your password again',
    randomNickname: 'Random',
    sendVerification: 'Send code',
    verifyEmail: 'Verify',
    signInSubmit: 'Sign in',
    signUpSubmit: 'Create account',
    forgotSubmit: 'Send reset email',
    resetSubmit: 'Save new password',
    switchToSignIn: 'Already have an account?',
    switchToSignUp: 'New here? Create an account',
    forgotPassword: 'Forgot your password?',
    backToLogin: 'Back to sign in',
    fillAll: 'Please fill in every field.',
    passwordMismatch: 'The two passwords do not match.',
    verificationSent: 'We sent a verification code to {{email}}.',
    verificationDone: 'Email verified. Now set your password and finish sign-up.',
    resetSent: 'We sent a reset email to {{email}}.',
    checkEmail: 'Open the link from your inbox to set a new password.',
    passwordHint: 'A password with at least 8 characters is a safer default.',
    passwordUpdated: 'Your new password is saved. You can sign in right away.',
    signOut: 'Sign out',
    currentUser: 'Signed in as {{name}}',
    setupNeeded: 'Add your Supabase keys to enable sign-in.',
    secureNote: 'Use email for auth only and show nicknames in the UI.',
    close: 'Close',
  },
  shareCard: {
    title: 'Share card',
    subtitle: 'Bring friends in',
    defaultText: 'Check what people are picking on Picksy right now.',
    button: 'Copy text',
    done: 'Copied',
    resultText:
      'On Picksy I picked "{{label}}" and {{percent}}% matched me. I am on a {{streak}}-pick streak.',
  },
  cards: enCards,
  leaderboard: [
    { name: 'Mina', title: 'Taste sniper', streak: 41 },
    { name: 'Jun', title: 'Prediction ace', streak: 33 },
    { name: 'Sora', title: 'Consensus hunter', streak: 29 },
  ],
  rewards: ['Friend compare card', 'Host of the day badge', 'Private ranking pass'],
} satisfies TranslationShape

export const resources = {
  ko: {
    translation: koTranslation,
  },
  en: {
    translation: enTranslation,
  },
} as const
