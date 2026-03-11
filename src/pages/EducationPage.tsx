import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getEducationalContent } from '@/db/api';
import type { EducationalContent } from '@/types';
import { BookOpen, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { generateAIResponse } from '@/services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FEATURED_CONTENT: EducationalContent[] = [
  {
    id: 'static-1',
    title: 'Welcome to Your Pregnancy Journey',
    content: 'Congratulations on your pregnancy! This is an exciting time. Regular check-ins and monitoring are essential for you and your baby\'s health. Remember to attend all clinic appointments and report any unusual symptoms immediately.',
    category: 'General',
    week_number: 1,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'static-2',
    title: 'Understanding Warning Signs',
    content: 'Important warning signs to watch for: severe headaches, blurred vision, severe abdominal pain, reduced fetal movement, vaginal bleeding, or sudden swelling. If you experience any of these, use the emergency alert immediately.',
    category: 'Safety',
    week_number: 4,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'static-3',
    title: 'Nutrition During Pregnancy',
    content: 'Eating well is crucial for your baby\'s development. Focus on: iron-rich foods (spinach, beans), calcium (milk, yogurt), proteins (eggs, fish, meat), and plenty of fruits and vegetables. Drink at least 8 glasses of water daily.',
    category: 'Nutrition',
    week_number: 8,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'static-4',
    title: 'Blood Pressure Awareness',
    content: 'High blood pressure during pregnancy can be dangerous. Symptoms include: severe headaches, vision changes, upper abdominal pain. Monitor your blood pressure regularly and report any concerns.',
    category: 'Health',
    week_number: 20,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'static-5',
    title: 'Fetal Movement Monitoring',
    content: 'From week 28 onwards, monitor your baby\'s movements daily. You should feel at least 10 movements in 2 hours. If movements decrease significantly, contact your healthcare provider immediately.',
    category: 'Monitoring',
    week_number: 28,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'static-6',
    title: 'Preparing for Labor',
    content: 'As you approach your due date, prepare your hospital bag, know the route to your clinic, and ensure your emergency contacts are updated in the system. Practice breathing exercises and stay calm.',
    category: 'Preparation',
    week_number: 36,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function EducationPage() {
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
      const prompt = `Suggest 5-7 high-quality maternal health resources including:
1. Recent articles from reputable medical sources (WHO, CDC, medical journals)
2. Educational YouTube videos about pregnancy and maternal care
3. Publications from maternal health doctors and experts
4. Evidence-based pregnancy guides

For each resource, provide:
- Title
- Type (Article/Video/Publication)
- Brief description (1-2 sentences)
- Why it's valuable for expectant mothers

Focus on trustworthy, evidence-based content that covers topics like prenatal care, nutrition, warning signs, fetal development, and labor preparation.`;

      const response = await generateAIResponse(prompt, 'suggestions');
      setAiSuggestions(response);
    } catch (error: any) {
      console.error('Error loading AI suggestions:', error);
      toast.error('Failed to load AI suggestions. Please try again.');
      setAiSuggestions('Unable to load suggestions at this time. Please try again later.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const allContent = [...FEATURED_CONTENT, ...content];

  const categories = ['all', 'General', 'Safety', 'Nutrition', 'Health', 'Monitoring', 'Preparation'];

  const filteredContent = selectedCategory === 'all'
    ? allContent
    : allContent.filter(c => c.category === selectedCategory);

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
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSuggestions}</ReactMarkdown>
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
