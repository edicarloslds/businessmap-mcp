# Publishing Scripts

Este diretório contém scripts para automatizar o processo de publicação do BusinessMap MCP Server.

## Scripts Disponíveis

### 📦 `publish-npm.sh` - Publicação NPM
Publica o pacote no NPM Registry.

**Uso:**
```bash
npm run publish:npm
```

**Pré-requisitos:**
- Versão já deve estar atualizada no package.json
- Projeto deve estar buildado e testado
- Usuário deve estar logado no NPM (`npm login`)

### 🏷️ `publish-github.sh` - Release GitHub
Cria uma release no GitHub com release notes automáticas.

**Uso:**
```bash
npm run publish:github
```

**Pré-requisitos:**
- Tag git deve existir ou será criada automaticamente
- GitHub CLI deve estar autenticado (`gh auth login`)
- Release notes são geradas automaticamente baseadas nos commits

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

## Fluxo de Trabalho Recomendado

### Processo de Publicação Separado
```bash
# 1. Atualizar versão manualmente no package.json ou usar npm version
npm version patch|minor|major

# 2. Publicar no NPM
npm run publish:npm

# 3. Criar release no GitHub
npm run publish:github
```

### Fluxo Alternativo
```bash
# Apenas publicar no NPM (sem release GitHub)
npm run publish:npm

# Apenas criar release no GitHub (sem publicar NPM)
npm run publish:github
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
