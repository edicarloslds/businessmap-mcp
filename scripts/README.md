# Publishing Scripts

Este diretório contém scripts para automatizar o processo de publicação do BusinessMap MCP Server.

## Scripts Disponíveis

### 📝 `version-bump.sh` - Bump de Versão
Script dedicado apenas ao bump de versão com preview das release notes.

**Uso:**
```bash
npm run version:bump
```

**Funcionalidades:**
- Seleção interativa do tipo de versão (patch, minor, major)
- Atualização automática do package.json
- Criação automática da tag git
- Preview das release notes que serão geradas

### 📦 `publish-npm.sh` - Publicação NPM
Publica o pacote no NPM Registry.

**Uso:**
```bash
npm run publish:npm
```

**Funcionalidades:**
- Detecção automática se a versão já foi publicada
- Bump automático de versão se necessário
- Build e testes automáticos
- Publicação no NPM

**Pré-requisitos:**
- Usuário deve estar logado no NPM (`npm login`)

### 🏷️ `publish-github.sh` - Release GitHub
Cria uma release no GitHub com release notes automáticas.

**Uso:**
```bash
npm run publish:github
```

**Funcionalidades:**
- Detecção automática se a release já existe
- Bump automático de versão se necessário
- Criação automática de tags git
- Geração automática de release notes
- Push automático das tags para o repositório

**Pré-requisitos:**
- GitHub CLI deve estar autenticado (`gh auth login`)

### 📝 `generate-release-notes.sh` - Geração de Release Notes
Gera release notes baseadas nos commits desde a última tag.

**Uso:**
```bash
bash scripts/generate-release-notes.sh <version> [commit-range]
```

### 👀 `preview-release-notes.sh` - Preview das Release Notes
Visualiza as release notes que seriam geradas.

**Uso:**
```bash
npm run preview:release
```

## Fluxos de Trabalho

### Opção 1: Processo Completamente Automático
```bash
# NPM detecta versão publicada e oferece bump automático
npm run publish:npm

# GitHub detecta release existente e oferece bump automático  
npm run publish:github
```

### Opção 2: Controle Manual da Versão
```bash
# 1. Bump de versão isolado
npm run version:bump

# 2. Publicar no NPM (sem bump adicional)
npm run publish:npm

# 3. Criar release no GitHub (sem bump adicional)
npm run publish:github
```

### Opção 3: Fluxos Independentes
```bash
# Apenas publicar no NPM (com bump automático se necessário)
npm run publish:npm

# Apenas criar release no GitHub (com bump automático se necessário)
npm run publish:github

# Apenas bump de versão (para preparar publicações futuras)
npm run version:bump
```

## Recursos de Segurança

- ✅ **Lock files** previnem execução duplicada
- ✅ **Validações** verificam autenticação e estado do repositório
- ✅ **Rollback automático** em caso de erro durante bump de versão
- ✅ **Confirmações** antes de executar ações irreversíveis
- ✅ **Cleanup automático** remove lock files ao sair

## Troubleshooting

### Script já está executando
```bash
rm /tmp/businessmap-mcp-publish*.lock
```

### Reverter bump de versão manual
```bash
git tag -d v<version>
git reset --hard HEAD~1
```

### Ver preview das release notes
```bash
npm run preview:release
```
