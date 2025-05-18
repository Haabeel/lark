"use client";

import {
  BotMessageSquare,
  GitCommitHorizontal,
  ListTodo,
  MessageCircleCode,
  ShieldCheck,
  Users,
} from "lucide-react";

const features = [
  {
    name: "AI Commit Summaries",
    description:
      "Instantly understand repository changes with concise, AI-generated summaries of every commit.",
    icon: GitCommitHorizontal,
    // Removed meeting summary feature as per your instruction
  },
  {
    name: "Codebase Q&A",
    description:
      "Ask natural language questions about your GitHub repository and get instant, context-aware answers from LARK AI.",
    icon: MessageCircleCode,
  },
  {
    name: "Real-time Communication",
    description:
      "Stay connected with Slack-like channels and task notifications tailored for your projects.",
    icon: BotMessageSquare, // Replaced MessageSquare for a more AI/bot feel
  },
  {
    name: "Integrated Project Management",
    description:
      "Organize your workflow with intuitive Kanban boards, calendar scheduling, and seamless task tracking.",
    icon: ListTodo,
  },
  {
    name: "Secure Collaboration",
    description:
      "Manage your team effectively with role-based access control for secure project contributions.",
    icon: ShieldCheck,
  },
  {
    name: "Credit-Based AI",
    description:
      "Flexible access to AI features with a generous free tier and premium options as your team grows.",
    icon: Users, // Placeholder, consider a better icon for 'credits' or 'AI resources'
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            Everything You Need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Intelligent Collaboration, Simplified
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            LARK brings together powerful AI insights and essential development
            tools to streamline your team&apos;s entire workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col items-start rounded-xl bg-card/50 p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:bg-card/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold leading-7 text-foreground">
                {feature.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
