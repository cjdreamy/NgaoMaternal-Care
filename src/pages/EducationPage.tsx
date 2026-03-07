import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getEducationalContent } from '@/db/api';
import type { EducationalContent } from '@/types';
import { BookOpen, Calendar, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function EducationPage() {
  const { profile } = useAuth();
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await getEducationalContent(100);
      setContent(data);
    } catch (error) {
      console.error('Error loading educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    setAiSuggestions('');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: `Suggest 5-7 high-quality maternal health resources including:
1. Recent articles from reputable medical sources (WHO, CDC, medical journals)
2. Educational YouTube videos about pregnancy and maternal care
3. Publications from maternal health doctors and experts
4. Evidence-based pregnancy guides

For each resource, provide:
- Title
- Type (Article/Video/Publication)
- Brief description (1-2 sentences)
- Why it's valuable for expectant mothers

Focus on trustworthy, evidence-based content that covers topics like prenatal care, nutrition, warning signs, fetal development, and labor preparation.`
            }
          ],
          type: 'suggestions'
        }
      });

      if (error) {
        const errorMsg = await error?.context?.text?.();
        console.error('AI suggestions error:', errorMsg || error?.message);
        throw new Error(errorMsg || 'Failed to get suggestions');
      }

      // Handle streaming response
      if (data) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                const text = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text) {
                  fullResponse += text;
                  setAiSuggestions(fullResponse);
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading AI suggestions:', error);
      toast.error('Failed to load AI suggestions. Please try again.');
      setAiSuggestions('Unable to load suggestions at this time. Please try again later.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(content.map(c => c.category)))];

  const filteredContent = selectedCategory === 'all' 
    ? content 
    : content.filter(c => c.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'General': 'bg-primary/10 text-primary',
      'Safety': 'bg-emergency/10 text-emergency',
      'Nutrition': 'bg-success/10 text-success',
      'Preparation': 'bg-secondary/10 text-secondary',
      'Monitoring': 'bg-warning/10 text-warning',
      'Health': 'bg-primary/10 text-primary'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Educational Resources
            </h1>
            <p className="text-muted-foreground">
              Learn about pregnancy health, warning signs, and prenatal care
            </p>
          </div>
          <Button
            onClick={loadAISuggestions}
            disabled={loadingSuggestions}
            className="gap-2"
          >
            {loadingSuggestions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Content Suggestions
          </Button>
        </div>

        {showSuggestions && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Recommended Resources
              </CardTitle>
              <CardDescription>
                Curated maternal health articles, videos, and expert publications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-5/6 bg-muted" />
                  <Skeleton className="h-4 w-4/6 bg-muted" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiSuggestions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Note: These are AI-generated suggestions. Always verify information with your healthcare provider.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {filteredContent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No educational content available in this category.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <Badge className={getCategoryColor(item.category)} variant="secondary">
                          {item.category}
                        </Badge>
                      </div>
                      {item.week_number && (
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Week {item.week_number}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                      {item.audio_url && (
                        <div className="mt-4">
                          <audio controls className="w-full">
                            <source src={item.audio_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
