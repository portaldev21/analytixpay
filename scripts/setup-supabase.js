#!/usr/bin/env node

/**
 * Script de configuração automática do Supabase
 * Execute: node scripts/setup-supabase.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('\n🚀 AnalytiXPay - Setup do Supabase\n')
  console.log('Este script irá configurar suas variáveis de ambiente.\n')

  // Verificar se já existe .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      '⚠️  Arquivo .env.local já existe. Deseja sobrescrevê-lo? (s/N): '
    )
    if (overwrite.toLowerCase() !== 's') {
      console.log('\n❌ Operação cancelada.\n')
      rl.close()
      return
    }
  }

  console.log('\n📝 Preencha as informações do seu projeto Supabase:\n')
  console.log('Você pode encontrar essas informações em: Settings → API\n')

  const supabaseUrl = await question('NEXT_PUBLIC_SUPABASE_URL: ')
  const supabaseAnonKey = await question('NEXT_PUBLIC_SUPABASE_ANON_KEY: ')
  const supabaseServiceKey = await question('SUPABASE_SERVICE_ROLE_KEY: ')
  const appUrl = await question(
    'NEXT_PUBLIC_APP_URL (padrão: http://localhost:3000): '
  )

  // Validações básicas
  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    console.log('\n❌ URL do Supabase inválida!\n')
    rl.close()
    return
  }

  if (!supabaseAnonKey || supabaseAnonKey.length < 100) {
    console.log('\n❌ Anon Key inválida!\n')
    rl.close()
    return
  }

  if (!supabaseServiceKey || supabaseServiceKey.length < 100) {
    console.log('\n❌ Service Role Key inválida!\n')
    rl.close()
    return
  }

  // Criar conteúdo do .env.local
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Application
NEXT_PUBLIC_APP_URL=${appUrl || 'http://localhost:3000'}
`

  // Salvar arquivo
  fs.writeFileSync(envPath, envContent)

  console.log('\n✅ Arquivo .env.local criado com sucesso!\n')
  console.log('📋 Próximos passos:\n')
  console.log('1. Execute o schema SQL no Supabase SQL Editor')
  console.log('   Arquivo: db/schema.sql\n')
  console.log('2. Crie o bucket "invoices" no Supabase Storage')
  console.log('   Vá em: Storage → Create bucket\n')
  console.log('3. Configure as políticas de Storage')
  console.log('   Veja: SETUP_GUIDE.md\n')
  console.log('4. Execute o projeto: npm run dev\n')

  rl.close()
}

main().catch((error) => {
  console.error('\n❌ Erro:', error.message, '\n')
  rl.close()
  process.exit(1)
})
