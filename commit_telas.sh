#!/bin/bash

# ==============================================================
#  LocaDJ — Push de telas separadas (Conventional Commits)
#  Aluno: Marcio Júnior
#  Padrão de branch: nome_feature/nome_aluno
# ==============================================================

set -e  # Para o script em caso de erro

MAIN_BRANCH="main"
ALUNO="marcio"

echo "================================================"
echo "  LocaDJ — Commit de telas (padrão internacional)"
echo "================================================"
echo ""
echo "0) Certifique-se de estar em '$MAIN_BRANCH' e atualizado..."
git checkout $MAIN_BRANCH
git pull origin $MAIN_BRANCH
echo ""

# --------------------------------------------------------------
# Função auxiliar: cria branch, faz commit e push
# Uso: commit_tela <branch_suffix> <arquivo> "<mensagem>"
# --------------------------------------------------------------
commit_tela() {
  local BRANCH_SUFFIX=$1
  local ARQUIVO=$2
  local MENSAGEM=$3

  BRANCH="${BRANCH_SUFFIX}/${ALUNO}"

  echo "----------------------------------------------"
  echo "  Branch : $BRANCH"
  echo "  Arquivo: $ARQUIVO"
  echo "----------------------------------------------"

  # Volta ao main antes de criar nova branch
  git checkout $MAIN_BRANCH

  # Cria (ou reseta) a branch
  git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

  # Adiciona apenas o arquivo da tela
  git add "$ARQUIVO"

  # Commit com mensagem passada
  git commit -m "$MENSAGEM"

  # Push
  git push origin "$BRANCH"

  echo "  ✅ Push feito: $BRANCH"
  echo ""
}

# ==============================================================
# 1. Tela: Meus Endereços
# ==============================================================
commit_tela \
  "tela_meus_enderecos" \
  "src/app/meus-enderecos.tsx" \
  "feat(screens): add meus-enderecos screen

- Address list with primary/secondary visual differentiation
- Action menu (3-dot icon) per address item
- Footer button navigates to novo-endereco screen
- Custom header with back navigation

Closes #1"

# ==============================================================
# 2. Tela: Novo Endereço
# ==============================================================
commit_tela \
  "tela_novo_endereco" \
  "src/app/novo-endereco.tsx" \
  "feat(screens): add novo-endereco form screen

- CEP input with auto-format mask (00000-000)
- Fields: street, number, complement, neighborhood, city/state, label
- Toggle to set address as primary
- KeyboardAvoidingView for better UX

Closes #2"

# ==============================================================
# 3. Tela: Alterar Senha
# ==============================================================
commit_tela \
  "tela_alterar_senha" \
  "src/app/alterar-senha.tsx" \
  "feat(screens): add alterar-senha screen

- Three password fields with individual show/hide toggle
- Real-time strength indicators (8+ chars, uppercase, number, special char)
- Save button enabled only when all criteria are met and passwords match
- Visual dot indicators (green/gray/red)

Closes #3"

# ==============================================================
# 4. Tela: Suporte
# ==============================================================
commit_tela \
  "tela_suporte" \
  "src/app/suporte.tsx" \
  "feat(screens): add suporte (help & support) screen

- FAQ section with expandable accordion items
- Contact options: email, phone and WhatsApp with deep links
- Consistent purple header and back navigation

Closes #4"

# ==============================================================
# 5. Tela: Sobre o App
# ==============================================================
commit_tela \
  "tela_sobre_app" \
  "src/app/sobre-o-app.tsx" \
  "feat(screens): add sobre-o-app (about) screen

- App logo with purple shadow, version badge and tagline
- App description card
- Links: Privacy Policy, Terms of Use, Open Source Licenses
- Contact links: email and website

Closes #5"

# ==============================================================
# 6. Navegação: Perfil atualizado
# ==============================================================
commit_tela \
  "feat_nav_perfil" \
  "src/app/(tabs)/perfil.tsx" \
  "feat(navigation): wire profile screen buttons to new routes

- Meus Endereços → /meus-enderecos
- Alterar Senha → /alterar-senha
- Suporte → /suporte
- Sobre o Aplicativo → /sobre-o-app

Closes #6"

# ==============================================================
echo "================================================"
echo "  ✅ Todas as branches foram criadas e enviadas!"
echo ""
echo "  Próximos passos no GitHub:"
echo "  1. Abrir cada branch como Pull Request"
echo "  2. Em cada PR → Development → vincular à issue"
echo "  3. Atribuir o PR ao responsável (Marcio)"
echo "  4. Fazer merge na ordem: 1 → 2 → 3 → 4 → 5 → 6"
echo "================================================"
