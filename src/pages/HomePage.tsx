import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shield, Bell, BookOpen, Activity, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://miaoda-conversation-file.s3cdn.medo.dev/user-a1icbsdgcg00/conv-a2blkp7a43cw/20260310/file-a66tzpapzq4g.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/60 to-background/70 backdrop-blur-[2px]" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/ngaologo.jpg"
                alt="NgaoMaternal Care Logo"
                className="h-20 w-20 object-cover rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              NgaoMaternal Care
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Bridging the gap between rural pregnant women and healthcare facilities
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              24/7 health monitoring, emergency alerts, and prenatal education through accessible technology.
              Our mission: Zero preventable maternal deaths.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Core Components</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides monitoring, emergency response, and education
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>The Guardian</CardTitle>
                <CardDescription>24/7 Health Monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Daily health check-ins with automatic risk flagging. Monitor vital signs including blood pressure,
                  heart rate, and fetal movement to identify complications early.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emergency/10 mb-4">
                  <Bell className="h-6 w-6 text-emergency" />
                </div>
                <CardTitle>The LifeLine</CardTitle>
                <CardDescription>Emergency Response</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  One-tap panic button with GPS location transmission to the nearest clinic.
                  Accessible to mothers and family members for immediate emergency alerts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 mb-4">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>The Link</CardTitle>
                <CardDescription>Prenatal Education</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Weekly educational content in local languages. Prenatal guidance, warning signs awareness,
                  and family support information delivered directly to you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We Serve</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Supporting mothers, families, and healthcare providers
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Expectant Mothers</h3>
              <p className="text-muted-foreground">
                Daily health monitoring, emergency alerts, and educational resources to ensure a safe pregnancy journey.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Family Members</h3>
              <p className="text-muted-foreground">
                Empower families to act as first responders with emergency alert capabilities and health monitoring support.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <Shield className="h-8 w-8 text-success" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Healthcare Providers</h3>
              <p className="text-muted-foreground">
                Real-time patient monitoring, priority alerts, and comprehensive dashboards for efficient triage and care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Join Us in Achieving Zero Preventable Maternal Deaths
            </h2>
            <p className="text-lg opacity-90">
              Together, we can bridge the communication gap and save lives through accessible healthcare technology.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="mt-4">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
