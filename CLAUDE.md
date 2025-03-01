# Oathsworn Might Deck - Dev Reference

## Build & Test Commands
- Start dev server: `bun run start`
- Run all tests: `bun run test`
- Run specific test: `bun run test -- -t "test name pattern"`
- Run tests in watch mode: `bun run run test:watch`
- Build for production: `bun run build`
- Deploy to GitHub Pages: `bun run deploy`

## Code Style & Conventions
- **TypeScript**: Strict typing enabled, use explicit return types
- **Formatting**: Prettier with single quotes (`'`)
- **Component Structure**: Functional components with FC type, props interface defined
- **State Management**: Use React hooks for state, with typed states
- **Naming**:
  - Classes: PascalCase (e.g., `MightCard`)
  - Interfaces/Types: PascalCase, prefixed with 'I' for interfaces
  - Props: ComponentNameProps (e.g., `CMightCardProps`)
  - Files: PascalCase for components/classes, camelCase for utilities
- **CSS**: Material-UI with makeStyles pattern for component styling
- **Testing**: Jest with React Testing Library, tests in same directory as implementation