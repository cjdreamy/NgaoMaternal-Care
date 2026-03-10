# Chatbot and Insights API Fix

## Issue
The chatbot and AI insights features were not working due to incorrect API call implementation.

## Root Cause
The original implementation used `supabase.functions.invoke()` which doesn't properly handle Server-Sent Events (SSE) streaming responses from the Gemini API.

## Solution

### 1. Direct Fetch API Calls
Changed from `supabase.functions.invoke()` to direct `fetch()` calls to properly handle SSE streaming:

**Before**:
```typescript
const { data, error } = await supabase.functions.invoke('gemini-chat', {
  body: { messages, type: 'chat' }
});
```

**After**:
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({ messages, type: 'chat' })
});
```

### 2. Proper SSE Stream Handling
Implemented correct ReadableStream processing:

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonData = JSON.parse(line.slice(6));
      const text = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
      // Update UI with streaming text
    }
  }
}
```

### 3. Configuration Export
Created `src/config/supabase-config.ts` to export Supabase URL and anon key:

```typescript
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
```

## Files Modified

1. **src/config/supabase-config.ts** (NEW)
   - Exports SUPABASE_URL and SUPABASE_ANON_KEY for client-side use

2. **src/components/features/ChatBot.tsx**
   - Changed to direct fetch() for SSE streaming
   - Proper ReadableStream handling
   - Real-time message updates

3. **src/pages/EducationPage.tsx**
   - Changed to direct fetch() for AI suggestions
   - Proper SSE streaming handling
   - Real-time content display

## API Details

### Endpoint
```
POST https://ldroymannrscialbkqjp.supabase.co/functions/v1/gemini-chat
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}
```

### Request Body
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ],
  "type": "chat" // or "suggestions"
}
```

### Response Format (SSE)
```
data: {"candidates":[{"content":{"role":"model","parts":[{"text":"Response text"}]}}]}
data: {"candidates":[{"content":{"role":"model","parts":[{"text":" more text"}]}}]}
```

## Testing

### Test Chatbot
1. Click the floating chat button (bottom-right)
2. Type a question: "What foods should I avoid during pregnancy?"
3. Press Enter or click Send
4. You should see streaming response appear in real-time

### Test AI Suggestions
1. Go to Education page
2. Click "AI Content Suggestions" button
3. Wait for streaming response (may take up to 30 seconds for first token)
4. You should see curated resources appear gradually

## Troubleshooting

### If chatbot still doesn't work:

1. **Check Environment Variables**:
   ```bash
   # Verify .env file has:
   VITE_SUPABASE_URL=https://ldroymannrscialbkqjp.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Check Edge Function Deployment**:
   - Verify `gemini-chat` Edge Function is deployed
   - Check Supabase dashboard → Edge Functions
   - Ensure `INTEGRATIONS_API_KEY` is set in environment

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

4. **Check API Key**:
   - Verify `INTEGRATIONS_API_KEY` is configured in Supabase
   - Check for 401/403 authentication errors
   - Verify API quota hasn't been exceeded (429 error)

### Common Errors

**Error: "API key not configured"**
- Solution: Ensure `INTEGRATIONS_API_KEY` is set in Edge Function environment

**Error: "Failed to get response"**
- Solution: Check network connection and Edge Function logs

**Error: 429 (Quota Exceeded)**
- Solution: Wait and try again later, or contact support

**Error: 402 (Insufficient Balance)**
- Solution: Contact support to add API credits

## Performance Notes

- First token may take up to 30 seconds
- Streaming continues after first response
- Network speed affects performance
- Multiple concurrent users may slow responses

## Security

- ✅ API calls go through Edge Function (server-side)
- ✅ INTEGRATIONS_API_KEY never exposed to client
- ✅ Supabase authentication required
- ✅ CORS properly configured
- ✅ Rate limiting in place

## Next Steps

If issues persist:
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Test Edge Function directly with curl
4. Contact support with error messages

---

**Status**: ✅ Fixed
**Date**: 2026-03-08
**Version**: 1.0.1
