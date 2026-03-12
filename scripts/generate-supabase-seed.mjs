import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(projectRoot, 'src', 'locales', 'resources.ts')
const outputPath = path.join(projectRoot, 'supabase', 'seed.sql')

const sourceCode = readFileSync(sourcePath, 'utf8')
const compiled = ts.transpileModule(sourceCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText

const module = { exports: {} }
const context = vm.createContext({
  module,
  exports: module.exports,
  require,
  console,
  process,
  __dirname: path.dirname(sourcePath),
  __filename: sourcePath,
})

new vm.Script(compiled, { filename: sourcePath }).runInContext(context)

const { resources } = module.exports

if (!resources?.ko?.translation || !resources?.en?.translation) {
  throw new Error('Could not read localized resources from resources.ts')
}

function toJsonLiteral(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
}

const locales = ['ko', 'en']
const rows = locales.flatMap((locale) => {
  const translation = resources[locale].translation

  return [
    { locale, key: 'cards', payload: translation.cards },
    { locale, key: 'leaderboard', payload: translation.leaderboard },
    { locale, key: 'rewards', payload: translation.rewards },
    { locale, key: 'comments', payload: translation.community.items },
  ]
})

const values = rows
  .map((row) => `  ('${row.locale}', '${row.key}', ${toJsonLiteral(row.payload)})`)
  .join(',\n')

const sql = `-- Generated from src/locales/resources.ts
insert into public.app_content (locale, content_key, payload)
values
${values}
on conflict (locale, content_key)
do update set
  payload = excluded.payload,
  updated_at = timezone('utc', now());
`

mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(outputPath, sql, 'utf8')

console.log(`Wrote ${rows.length} rows to ${outputPath}`)
