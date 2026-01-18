# GitHub Issue Creator

A Figma plugin that allows users to create GitHub issues directly from Figma in the `db-ux-design-system/core` repository.

## Features

- Configure GitHub Personal Access Token
- Choose between Bug and Feature templates
- Create issues with structured templates
- Direct link to created issues

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Structure

- `plugin/` - Plugin code (runs in Figma sandbox)
- `ui/` - React UI components
- `dist/` - Built files

## Requirements

- Node.js >= 22
- GitHub Personal Access Token with `repo` scope
