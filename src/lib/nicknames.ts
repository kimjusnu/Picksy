const koreanAdjectives = [
  '수다쟁이',
  '반짝이는',
  '호기심 많은',
  '느긋한',
  '재빠른',
  '다정한',
  '용감한',
  '통통 튀는',
  '고요한',
  '엉뚱한',
]

const koreanAnimals = [
  '얼룩말',
  '여우',
  '고래',
  '참새',
  '판다',
  '토끼',
  '사자',
  '다람쥐',
  '고양이',
  '펭귄',
]

const englishAdjectives = [
  'Chatty',
  'Sparkly',
  'Curious',
  'Easygoing',
  'Swift',
  'Warm',
  'Playful',
  'Calm',
  'Brave',
  'Sunny',
]

const englishAnimals = [
  'Zebra',
  'Fox',
  'Whale',
  'Sparrow',
  'Panda',
  'Rabbit',
  'Lion',
  'Squirrel',
  'Cat',
  'Penguin',
]

function buildNicknames(adjectives: string[], animals: string[]) {
  return adjectives.flatMap((adjective) => animals.map((animal) => `${adjective} ${animal}`))
}

export const nicknameCatalog = {
  ko: buildNicknames(koreanAdjectives, koreanAnimals),
  en: buildNicknames(englishAdjectives, englishAnimals),
} as const

export function getRandomNickname(language: 'ko' | 'en') {
  const list = nicknameCatalog[language]
  return list[Math.floor(Math.random() * list.length)]
}
