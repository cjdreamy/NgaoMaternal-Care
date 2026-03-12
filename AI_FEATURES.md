# AI-Powered Features Documentation

## Overview

NgaoMaternal Care now includes AI-powered features using Google's Gemini 1.5 Flash model to provide:
1. **Pregnancy Insights Chatbot** - Interactive assistant for maternal health questions
2. **Educational Content Suggestions** - AI-curated articles, videos, and expert publications

---

## 1. Pregnancy Insights Chatbot

### Features
- **24/7 Availability**: Always accessible floating chat button
- **Real-time Streaming**: Instant responses with SSE streaming
- **Context-Aware**: Maintains conversation history
- **Compassionate Responses**: Trained to provide empathetic, supportive guidance
- **Safety-First**: Always recommends consulting healthcare providers for medical concerns

### How to Use

#### For Users
1. Click the floating chat button (💬) in the bottom-right corner
2. Type your question about pregnancy, nutrition, symptoms, or prenatal care
3. Press Enter or click Send
4. Receive instant AI-powered responses
5. Continue the conversation with follow-up questions

#### Example Questions
- "What foods should I avoid during pregnancy?"
- "Is it normal to feel tired in the first trimester?"
- "How can I track fetal movement?"
- "What are the warning signs of preeclampsia?"
- "How much water should I drink daily?"

### Technical Implementation

**Component**: `src/components/features/ChatBot.tsx`

**Key Features**:
- Floating button that expands to full chat interface
- Message history with user/assistant distinction
- Streaming response handling with SSE
- Abort controller for cancelling requests
- Auto-scroll to latest messages
- Loading states and error handling

**Edge Function**: `supabase/functions/gemini-chat/index.ts`

**API Integration**:
```typescript
const { data, error } = await supabase.functions.invoke('gemini-chat', {
  body: {
    messages: [
      { role: 'user', content: 'Your question here' }
    ],
    type: 'chat'
  }
});
```

---

## 2. Educational Content Suggestions

### Features
- **AI-Curated Resources**: Suggests relevant articles, videos, and publications
- **Evidence-Based**: Focuses on trustworthy medical sources
- **Comprehensive Coverage**: Topics include prenatal care, nutrition, warning signs, fetal development
- **One-Click Access**: Simple button to generate suggestions
- **Streaming Display**: Real-time content generation

### How to Use

#### For Users
1. Navigate to the **Education** page
2. Click the "AI Content Suggestions" button (✨)
3. Wait for AI to generate personalized recommendations
4. Review suggested resources with descriptions
5. Use the information to supplement your learning

#### What You'll Get
- **Articles**: From WHO, CDC, medical journals, reputable health sites
- **Videos**: Educational YouTube content about pregnancy and maternal care
- **Publications**: Expert doctor publications and research
- **Guides**: Evidence-based pregnancy and prenatal care guides

Each suggestion includes:
- Title
- Type (Article/Video/Publication)
- Brief description
- Why it's valuable for expectant mothers

### Technical Implementation

**Page**: `src/pages/EducationPage.tsx`

**Key Features**:
- Button to trigger AI suggestions
- Streaming response display
- Loading states with skeletons
- Formatted markdown-style output
- Disclaimer about AI-generated content

**API Integration**:
```typescript
const { data, error } = await supabase.functions.invoke('gemini-chat', {
  body: {
    messages: [
      {
        role: 'user',
        content: 'Suggest maternal health resources...'
      }
    ],
    type: 'suggestions'
  }
});
```

---

## Edge Function Architecture

### File Structure
```
supabase/functions/
├── _shared/
│   └── cors.ts          # CORS headers configuration
└── gemini-chat/
    └── index.ts         # Main Edge Function
```

### Edge Function: `gemini-chat`

**Purpose**: Proxy requests to Gemini API with proper authentication and streaming

**Endpoints**:
- **URL**: `https://your-project.supabase.co/functions/v1/gemini-chat`
- **Method**: POST
- **Auth**: Requires Supabase authentication

**Request Body**:
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

**Response**: Server-Sent Events (SSE) stream

**Environment Variables**:
- `INTEGRATIONS_API_KEY`: Gemini API authentication key (auto-configured)

### System Context

The Edge Function adds system context based on request type:

#### Chat Type
```
You are a compassionate maternal health assistant for NgaoMaternal Care. Provide:
- Evidence-based pregnancy and maternal health information
- Supportive and empathetic responses
- Clear guidance on when to seek medical attention
- Culturally sensitive advice
- Encouragement and reassurance

IMPORTANT: Always recommend consulting healthcare providers for medical concerns.
```

#### Suggestions Type
```
You are a maternal health content curator. Suggest relevant and trustworthy resources including:
1. Recent maternal health articles from reputable sources
2. Educational YouTube videos about pregnancy and maternal care
3. Publications from maternal health doctors and experts
4. Evidence-based pregnancy guides

Format your response as a structured list with titles, brief descriptions, and why each resource is valuable.
```

---

## API Details

### Gemini API Endpoint
```
POST https://app-a2blkp7a43cx-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse
```

### Headers
```
Content-Type: application/json
X-Gateway-Authorization: Bearer ${INTEGRATIONS_API_KEY}
```

### Request Format
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Your message here"
        }
      ]
    }
  ]
}
```

### Response Format (SSE)
```
data: {"candidates":[{"content":{"role":"model","parts":[{"text":"Response text"}]},"finishReason":"STOP"}]}
```

---

## Error Handling

### Client-Side
- **Network Errors**: Display user-friendly error messages
- **API Quota Exceeded (429)**: Inform user to try again later
- **Insufficient Balance (402)**: Contact support message
- **Timeout**: Abort controller cancels long-running requests
- **Invalid Response**: Graceful fallback messages

### Edge Function
- **Missing API Key**: Returns 500 with configuration error
- **Invalid Request**: Returns 400 with validation error
- **Gemini API Errors**: Logs error and returns appropriate status
- **CORS**: Handles preflight OPTIONS requests

---

## Security & Privacy

### Data Handling
- **No Storage**: Chat messages are not stored in database
- **Session-Only**: Conversation history exists only in browser memory
- **No PII**: Avoid sharing personal identifiable information in chat
- **Secure Transmission**: All requests over HTTPS
- **API Key Protection**: Keys stored securely in Edge Function environment

### Best Practices
1. **Don't share**: Personal medical records, test results, or diagnoses
2. **Do ask**: General questions about pregnancy, symptoms, nutrition
3. **Always consult**: Healthcare provider for medical advice and emergencies
4. **Verify information**: Cross-reference AI suggestions with trusted sources

---

## Limitations

### What the AI Can Do
✅ Provide general pregnancy and maternal health information
✅ Explain common symptoms and their typical causes
✅ Suggest healthy lifestyle practices
✅ Recommend when to seek medical attention
✅ Offer emotional support and encouragement
✅ Curate educational resources

### What the AI Cannot Do
❌ Diagnose medical conditions
❌ Prescribe medications or treatments
❌ Replace healthcare provider consultations
❌ Provide emergency medical advice
❌ Access your medical records
❌ Guarantee accuracy of all information

---

## Usage Guidelines

### For Mothers
- Use the chatbot for general pregnancy questions
- Ask about nutrition, exercise, and lifestyle
- Seek clarification on common symptoms
- Get suggestions for educational resources
- **Always consult your healthcare provider for medical concerns**

### For Healthcare Providers
- Review AI suggestions with patients
- Use as educational supplement, not replacement
- Verify information accuracy
- Provide context-specific medical advice
- Monitor patient understanding

### For Family Members
- Learn about supporting pregnant family members
- Understand pregnancy stages and needs
- Get tips on being a supportive partner
- Learn warning signs to watch for

---

## Troubleshooting

### Chatbot Not Responding
1. Check internet connection
2. Refresh the page
3. Clear browser cache
4. Try again in a few minutes (may be rate limited)

### Suggestions Not Loading
1. Click the button again
2. Check browser console for errors
3. Verify Edge Function is deployed
4. Contact support if issue persists

### Slow Responses
- First token may take up to 30 seconds
- Streaming continues after first response
- Network speed affects performance
- Multiple concurrent users may slow responses

---

## Development Notes

### Adding New Features

**To add a new AI-powered feature**:

1. Update Edge Function to handle new request type
2. Create React component for UI
3. Implement SSE streaming handling
4. Add error handling and loading states
5. Test thoroughly with various inputs

**Example**:
```typescript
// In Edge Function
if (type === 'new_feature') {
  contents.unshift({
    role: 'user',
    parts: [{ text: 'System prompt for new feature' }]
  });
}

// In React component
const { data } = await supabase.functions.invoke('gemini-chat', {
  body: { messages, type: 'new_feature' }
});
```

### Testing

**Local Testing**:
```bash
# Test Edge Function locally
supabase functions serve gemini-chat

# Make test request
curl -X POST http://localhost:54321/functions/v1/gemini-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test question"}],"type":"chat"}'
```

**Production Testing**:
1. Deploy Edge Function
2. Test chatbot with various questions
3. Test suggestions feature
4. Verify error handling
5. Check streaming performance

---

## Future Enhancements

### Planned Features
- [ ] Multi-language support (Swahili, French, etc.)
- [ ] Voice input/output for accessibility
- [ ] Image analysis for symptom checking
- [ ] Personalized recommendations based on pregnancy week
- [ ] Integration with health check-in data
- [ ] Saved conversation history (optional)
- [ ] Offline mode with cached responses

### Potential Improvements
- Faster response times with caching
- More specialized medical knowledge
- Integration with local healthcare resources
- Community-contributed Q&A
- Expert verification of AI responses

---

## Support

### For Users
- **In-App**: Use the chatbot to ask questions
- **Email**: support@ngaomaternal.care
- **Emergency**: Always call emergency services or your healthcare provider

### For Developers
- **Documentation**: See README.md and API docs
- **Edge Function Logs**: Check Supabase dashboard
- **Issues**: Report bugs via GitHub or support email

---

## Disclaimer

**IMPORTANT**: The AI chatbot and content suggestions are for informational purposes only and do not constitute medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns, emergencies, or specific health questions. NgaoMaternal Care and its AI features are supplements to, not replacements for, professional medical care.

---

**Last Updated**: 2026-03-08
**Version**: 1.0.0
**Model**: Gemini 1.5 Flash
