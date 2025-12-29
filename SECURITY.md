# Security Guidelines

## API Key Management

### Never Commit API Keys

API keys must NEVER be committed to version control. All API keys should be:
1. Stored in `.env` files (already in `.gitignore`)
2. Loaded via environment variables
3. Never hardcoded in source files

### Environment Variables

The following environment variables are used:

```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_ELEVENLABS_VOICE_ID=your_voice_id
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Web App (Vite)

API keys are accessed via:
```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

### Test Scripts (Node.js)

API keys are accessed via:
```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
```

Run with:
```bash
GEMINI_API_KEY=your_key node test_voice_control.js
```

## What To Do If A Key Is Exposed

1. **Immediately revoke the exposed key** at the API provider's console
2. **Generate a new key** and update `.env` file locally
3. **Clean git history** to remove the exposed key:
   ```bash
   git filter-branch -f --tree-filter \
     "if [ -f affected_file.js ]; then sed -i '' 's/OLD_KEY/PLACEHOLDER/g' affected_file.js; fi" \
     HEAD~N..HEAD
   ```
4. **Force push** to overwrite public repository history:
   ```bash
   git push --force origin main
   ```

## Checklist Before Committing

- [ ] No API keys in source code
- [ ] `.env` file is in `.gitignore`
- [ ] Test scripts use environment variables
- [ ] Documentation shows environment variable usage, not actual keys

## Protected Files

These files should NEVER be committed:
- `.env`
- `.env.local`
- `.env.production`
- Any file containing actual API keys or credentials
