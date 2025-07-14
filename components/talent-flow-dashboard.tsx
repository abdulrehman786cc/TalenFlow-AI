"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Upload,
  Brain,
  Mic,
  Users,
  Database,
  Target,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Play,
  ArrowRight,
  Zap,
  Loader2,
  MessageSquare,
  AlertCircle,
  ThumbsDown,
  Eye,
  Activity,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type AgentStatus = "idle" | "processing" | "completed" | "needs-review"

interface AgentAction {
  id: string
  agentId: string
  agentName: string
  action: string
  details: string
  timestamp: Date
  status: "success" | "warning" | "error"
  candidateId?: string
  candidateName?: string
  data?: any
}

interface Candidate {
  id: string
  name: string
  experience: string
  skills: string[]
  semanticScore?: number
  interviewScore?: number
  finalScore?: number
  status?: "recommended" | "needs-review" | "rejected"
  highlights?: string[]
  concerns?: string[]
  interviewResponses?: {
    question: string
    answer: string
    score: number
  }[]
  processingStep?: number
}

interface JobData {
  title: string
  description: string
  requirements: string[]
  unwrittenNeeds: string[]
}

const agents = [
  { id: "ingestion", name: "Intake Agent", icon: Upload, description: "Parse JD & CVs", color: "bg-blue-500" },
  {
    id: "semantic",
    name: "Insight Agent",
    icon: Brain,
    description: "Meaning-based analysis",
    color: "bg-purple-500",
  },
  { id: "interview", name: "Interviewer Agent", icon: Mic, description: "Async interviews", color: "bg-green-500" },
  { id: "human", name: "Human-in-Loop", icon: Users, description: "Review & override", color: "bg-yellow-500" },
  { id: "memory", name: "Learning Insights", icon: Database, description: "Store & learn", color: "bg-indigo-500" },
  {
    id: "recommendation",
    name: "Recommender Agent",
    icon: Target,
    description: "Ranked results",
    color: "bg-red-500",
  },
]

const rawJobData: JobData = {
  title: "Frontend Engineer",
  description:
    "Frontend Engineer with React & accessibility focus. Mentor junior devs. Collaborate with cross-functional teams.",
  requirements: ["React", "JavaScript", "CSS", "Accessibility", "Mentoring"],
  unwrittenNeeds: ["Team collaboration", "Growth mindset", "Communication skills", "Mentorship potential"],
}

const rawCandidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Ahmed",
    experience: "5 yrs React, 1 yr WCAG work, led team workshops. Created Storybook design system for GovTech.",
    skills: ["React", "WCAG", "Storybook", "Team Leadership", "Design Systems"],
    semanticScore: 94,
    interviewScore: 90,
    finalScore: 92,
    status: "recommended",
    highlights: [
      "Strong accessibility experience with WCAG",
      "Proven mentorship through team workshops",
      "Design system creation shows systematic thinking",
      "Government sector experience indicates attention to compliance",
    ],
    concerns: [],
    interviewResponses: [
      {
        question: "Tell me about a time you led accessibility work.",
        answer:
          "I led the accessibility audit for our government portal, implementing WCAG 2.1 AA standards. I created training materials and conducted workshops for the team, resulting in 100% compliance and improved user satisfaction scores.",
        score: 95,
      },
      {
        question: "How do you handle feedback?",
        answer:
          "I view feedback as growth opportunities. When our design system received criticism, I organized stakeholder sessions to understand concerns and iteratively improved it based on user needs.",
        score: 88,
      },
      {
        question: "What excites you about frontend work?",
        answer:
          "Creating inclusive experiences that work for everyone. I love the challenge of making complex interfaces simple and accessible, especially when it helps underserved communities access important services.",
        score: 92,
      },
    ],
  },
  {
    id: "2",
    name: "John Doe",
    experience: "7 yrs React, high-speed prototyping. No accessibility experience. Strong solo contributor.",
    skills: ["React", "Prototyping", "Performance Optimization", "Solo Work"],
    semanticScore: 72,
    interviewScore: 45,
    finalScore: 56,
    status: "needs-review",
    highlights: [
      "Extensive React experience (7 years)",
      "Strong technical prototyping skills",
      "Performance optimization expertise",
    ],
    concerns: [
      "No accessibility experience",
      "Limited team collaboration evidence",
      "Weak mentorship indicators",
      "Poor communication in interview responses",
    ],
    interviewResponses: [
      {
        question: "Tell me about a time you led accessibility work.",
        answer: "I haven't really worked on accessibility stuff. I focus more on making things fast and functional.",
        score: 20,
      },
      {
        question: "How do you handle feedback?",
        answer: "I usually know what I'm doing so I don't need much feedback. If someone has an issue I'll fix it.",
        score: 35,
      },
      {
        question: "What excites you about frontend work?",
        answer:
          "Building cool features and solving technical challenges. I like working on complex algorithms and optimization problems.",
        score: 65,
      },
    ],
  },
]

export function TalentFlowDashboard() {
  const [activeTab, setActiveTab] = useState("pipeline")
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({
    ingestion: "idle",
    semantic: "idle",
    interview: "idle",
    human: "idle",
    memory: "idle",
    recommendation: "idle",
  })

  // Progressive data states
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [semanticResults, setSemanticResults] = useState<Candidate[]>([])
  const [interviewResults, setInterviewResults] = useState<Candidate[]>([])
  const [finalResults, setFinalResults] = useState<Candidate[]>([])
  const [learningInsights, setLearningInsights] = useState<any[]>([])

  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingCandidate, setCurrentProcessingCandidate] = useState<string | null>(null)
  const [humanDecisions, setHumanDecisions] = useState<
    Array<{
      candidateId: string
      decision: string
      rationale: string
      timestamp: Date
    }>
  >([])
  const [pendingHumanReview, setPendingHumanReview] = useState<Candidate[]>([])
  const [agentActions, setAgentActions] = useState<AgentAction[]>([])

  const [selectedCandidateForBriefing, setSelectedCandidateForBriefing] = useState<Candidate | null>(null)
  const [isBriefingDialogOpen, setIsBriefingDialogOpen] = useState(false)

  const addAgentAction = (
    agentId: string,
    agentName: string,
    action: string,
    details: string,
    status: "success" | "warning" | "error" = "success",
    candidateId?: string,
    candidateName?: string,
    data?: any,
  ) => {
    const newAction: AgentAction = {
      id: Date.now().toString(),
      agentId,
      agentName,
      action,
      details,
      timestamp: new Date(),
      status,
      candidateId,
      candidateName,
      data,
    }
    setAgentActions((prev) => [...prev, newAction])
  }

  const startProcessing = async () => {
    setIsProcessing(true)
    setActiveTab("pipeline")

    // Reset all data
    setJobData(null)
    setCandidates([])
    setSemanticResults([])
    setInterviewResults([])
    setFinalResults([])
    setLearningInsights([])
    setHumanDecisions([])
    setPendingHumanReview([])
    setAgentActions([])

    addAgentAction("system", "System", "Pipeline Started", "Multi-agent hiring pipeline initiated", "success")

    // Step 1: Data Ingestion
    setAgentStatuses((prev) => ({ ...prev, ingestion: "processing" }))
    addAgentAction("ingestion", "Data Ingestion", "Processing Started", "Parsing job description and CVs", "success")

    await new Promise((resolve) => setTimeout(resolve, 1500))
    setJobData(rawJobData)
    addAgentAction(
      "ingestion",
      "Data Ingestion",
      "Job Analysis Complete",
      `Analyzed ${rawJobData.title} role with ${rawJobData.requirements.length} requirements and ${rawJobData.unwrittenNeeds.length} unwritten needs`,
      "success",
    )

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setCandidates(
      rawCandidates.map((c) => ({
        id: c.id,
        name: c.name,
        experience: c.experience,
        skills: c.skills,
      })),
    )

    addAgentAction(
      "ingestion",
      "Data Ingestion",
      "CV Processing Complete",
      `Successfully processed ${rawCandidates.length} candidate CVs`,
      "success",
    )

    setAgentStatuses((prev) => ({ ...prev, ingestion: "completed", semantic: "processing" }))

    // Step 2: Semantic Analysis
    addAgentAction("semantic", "Semantic Matcher", "Analysis Started", "Beginning semantic analysis of candidates")

    for (let i = 0; i < rawCandidates.length; i++) {
      const candidate = rawCandidates[i]
      setCurrentProcessingCandidate(candidate.id)

      addAgentAction(
        "semantic",
        "Semantic Matcher",
        "Candidate Analysis",
        `Analyzing semantic match for ${candidate.name}`,
        "success",
        candidate.id,
        candidate.name,
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const semanticScore = candidate.semanticScore || 0
      const status = semanticScore >= 80 ? "success" : semanticScore >= 60 ? "warning" : "error"

      setSemanticResults((prev) => [
        ...prev,
        {
          ...candidate,
          semanticScore: candidate.semanticScore,
          highlights: candidate.highlights,
          concerns: candidate.concerns,
        },
      ])

      addAgentAction(
        "semantic",
        "Semantic Matcher",
        "Score Calculated",
        `${candidate.name} scored ${semanticScore}% semantic match${semanticScore < 70 ? " - Below threshold" : ""}`,
        status,
        candidate.id,
        candidate.name,
        { score: semanticScore, threshold: 70 },
      )
    }

    setCurrentProcessingCandidate(null)
    setAgentStatuses((prev) => ({ ...prev, semantic: "completed", interview: "processing" }))

    // Step 3: Interview Processing
    addAgentAction("interview", "Screening Interview", "Interviews Started", "Conducting async screening interviews")

    for (let i = 0; i < rawCandidates.length; i++) {
      const candidate = rawCandidates[i]
      setCurrentProcessingCandidate(candidate.id)

      addAgentAction(
        "interview",
        "Screening Interview",
        "Interview Started",
        `Conducting 3-question interview with ${candidate.name}`,
        "success",
        candidate.id,
        candidate.name,
      )

      await new Promise((resolve) => setTimeout(resolve, 2500))

      const interviewScore = candidate.interviewScore || 0
      const status = interviewScore >= 80 ? "success" : interviewScore >= 60 ? "warning" : "error"

      setInterviewResults((prev) => [
        ...prev,
        {
          ...candidate,
          semanticScore: candidate.semanticScore,
          interviewScore: candidate.interviewScore,
          interviewResponses: candidate.interviewResponses,
          highlights: candidate.highlights,
          concerns: candidate.concerns,
        },
      ])

      addAgentAction(
        "interview",
        "Screening Interview",
        "Interview Complete",
        `${candidate.name} scored ${interviewScore}% in interview${interviewScore < 60 ? " - Poor communication detected" : ""}`,
        status,
        candidate.id,
        candidate.name,
        { score: interviewScore, responses: candidate.interviewResponses?.length || 0 },
      )
    }

    setCurrentProcessingCandidate(null)
    setAgentStatuses((prev) => ({ ...prev, interview: "completed", human: "needs-review" }))

    // Step 4: Identify candidates needing human review
    const needsReview = rawCandidates.filter((c) => (c.finalScore || 0) < 70 || (c.concerns || []).length > 0)
    setPendingHumanReview(
      needsReview.map((c) => ({
        ...c,
        semanticScore: c.semanticScore,
        interviewScore: c.interviewScore,
        finalScore: c.finalScore,
        highlights: c.highlights,
        concerns: c.concerns,
      })),
    )

    addAgentAction(
      "human",
      "Human-in-Loop",
      "Review Required",
      `${needsReview.length} candidates flagged for human review due to low confidence or conflicting signals`,
      "warning",
    )

    for (const candidate of needsReview) {
      addAgentAction(
        "human",
        "Human-in-Loop",
        "Candidate Flagged",
        `${candidate.name} requires human review - AI confidence: ${candidate.finalScore}%`,
        "warning",
        candidate.id,
        candidate.name,
        { reasons: candidate.concerns, aiScore: candidate.finalScore },
      )
    }
  }

  const handleHumanDecision = async (candidateId: string, decision: "approve" | "reject", rationale: string) => {
    const candidate = pendingHumanReview.find((c) => c.id === candidateId)
    const newDecision = {
      candidateId,
      decision,
      rationale,
      timestamp: new Date(),
    }

    setHumanDecisions((prev) => [...prev, newDecision])
    setPendingHumanReview((prev) => prev.filter((c) => c.id !== candidateId))

    // Log human decision
    addAgentAction(
      "human",
      "Human-in-Loop",
      "Decision Made",
      `Human ${decision}d ${candidate?.name}: ${rationale}`,
      decision === "approve" ? "success" : "error",
      candidateId,
      candidate?.name,
      { decision, rationale, aiScore: candidate?.finalScore },
    )

    // Check if this is an override of AI recommendation
    if (candidate) {
      const aiRecommendation = (candidate.finalScore || 0) >= 70 ? "approve" : "reject"
      if (aiRecommendation !== decision) {
        addAgentAction(
          "human",
          "Human-in-Loop",
          "AI Override",
          `Human overrode AI recommendation for ${candidate.name} (AI: ${aiRecommendation}, Human: ${decision})`,
          "warning",
          candidateId,
          candidate.name,
          { aiRecommendation, humanDecision: decision, override: true },
        )
      }
    }

    // Check if all decisions are made
    const allCandidatesNeedingReview = rawCandidates.filter(
      (c) => (c.finalScore || 0) < 70 || (c.concerns || []).length > 0,
    )
    const totalDecisions = humanDecisions.length + 1

    if (totalDecisions >= allCandidatesNeedingReview.length) {
      // Continue to memory and final recommendation
      setAgentStatuses((prev) => ({ ...prev, human: "completed", memory: "processing" }))

      addAgentAction(
        "memory",
        "Memory & Learning",
        "Learning Started",
        "Analyzing hiring patterns and human decisions for future improvements",
      )

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate learning insights
      const insights = [
        {
          pattern: "Accessibility Experience",
          insight: "Candidates with WCAG experience show 40% higher success rate",
          confidence: 85,
          sampleSize: 12,
        },
        {
          pattern: "Communication Style",
          insight: "Detailed, empathetic responses correlate with team fit",
          confidence: 78,
          sampleSize: 8,
        },
        {
          pattern: "Solo vs Team Work",
          insight: "Pure solo contributors struggle in collaborative roles",
          confidence: 92,
          sampleSize: 15,
        },
      ]

      setLearningInsights(insights)

      for (const insight of insights) {
        addAgentAction(
          "memory",
          "Memory & Learning",
          "Pattern Discovered",
          `${insight.pattern}: ${insight.insight}`,
          "success",
          undefined,
          undefined,
          insight,
        )
      }

      setAgentStatuses((prev) => ({ ...prev, memory: "completed", recommendation: "processing" }))

      addAgentAction(
        "recommendation",
        "Final Recommendation",
        "Generating Rankings",
        "Compiling final candidate recommendations based on all agent inputs",
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate final results with human decisions applied
      const finalCandidates = rawCandidates.map((candidate) => {
        const humanDecision = [...humanDecisions, newDecision].find((d) => d.candidateId === candidate.id)
        const finalStatus = humanDecision
          ? humanDecision.decision === "approve"
            ? "recommended"
            : "rejected"
          : candidate.status || "needs-review"

        return {
          ...candidate,
          status: finalStatus,
        }
      })

      setFinalResults(finalCandidates)

      // Log final recommendations
      for (const candidate of finalCandidates) {
        addAgentAction(
          "recommendation",
          "Final Recommendation",
          "Candidate Ranked",
          `${candidate.name} - Final Status: ${candidate.status} (Score: ${candidate.finalScore}%)`,
          candidate.status === "recommended" ? "success" : candidate.status === "rejected" ? "error" : "warning",
          candidate.id,
          candidate.name,
          { finalStatus: candidate.status, finalScore: candidate.finalScore },
        )
      }

      setAgentStatuses((prev) => ({ ...prev, recommendation: "completed" }))
      setIsProcessing(false)

      addAgentAction(
        "system",
        "System",
        "Pipeline Complete",
        `Hiring pipeline completed successfully. ${finalCandidates.filter((c) => c.status === "recommended").length} candidates recommended for panel interviews`,
        "success",
      )
    }
  }

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin" />
      case "needs-review":
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
      default:
        return <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gray-300" />
    }
  }

  const getProgressPercentage = () => {
    const completedSteps = Object.values(agentStatuses).filter((status) => status === "completed").length
    return (completedSteps / agents.length) * 100
  }

  const getActionIcon = (action: AgentAction) => {
    switch (action.agentId) {
      case "ingestion":
        return <Upload className="h-4 w-4" />
      case "semantic":
        return <Brain className="h-4 w-4" />
      case "interview":
        return <Mic className="h-4 w-4" />
      case "human":
        return <Users className="h-4 w-4" />
      case "memory":
        return <Database className="h-4 w-4" />
      case "recommendation":
        return <Target className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400 bg-green-900/20 border-green-700"
      case "warning":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700"
      case "error":
        return "text-red-400 bg-red-900/20 border-red-700"
      default:
        return "text-gray-300 bg-gray-800 border-gray-700"
    }
  }

  const handleViewBriefing = (candidate: Candidate) => {
    setSelectedCandidateForBriefing(candidate)
    setIsBriefingDialogOpen(true)

    // Log the action for tracking
    addAgentAction(
      "system",
      "System",
      "Briefing Viewed",
      `User viewed detailed briefing for ${candidate.name}`,
      "success",
      candidate.id,
      candidate.name,
    )
  }

  const handleCloseBriefing = () => {
    setIsBriefingDialogOpen(false)
    setSelectedCandidateForBriefing(null)
  }

  return (
    <div className="min-h-screen bg-[#111A26] p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#0583F2] to-[#0583F2] flex items-center justify-center">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">TalentFlowAI</h1>
              <p className="text-sm sm:text-base text-gray-300">Powered By ClickChain.ai</p>
            </div>
          </div>
          {!isProcessing && !jobData && (
            <Button onClick={startProcessing} size="lg" className="bg-[#0583F2] hover:bg-[#0583F2]/90 w-full sm:w-auto">
              <Play className="h-4 w-4 mr-2" />
              Start Hiring
            </Button>
          )}
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-[#1A2332] border-gray-700">
            <TabsTrigger
              value="pipeline"
              className="flex items-center gap-2 text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#0583F2]"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Flow View</span>
              <span className="sm:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="flex items-center gap-2 text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#0583F2]"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Review Inbox</span>
              <span className="sm:hidden">Review</span>
              {agentActions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {agentActions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4 sm:mt-6">
            {/* Pipeline Progress */}
            {(isProcessing || jobData) && (
              <Card className="bg-[#1A2332] border-gray-700 mb-4 sm:mb-6">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-white">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#0583F2]" />
                      WorkFlow Progress
                    </CardTitle>
                    <Badge variant="secondary" className="text-sm w-fit">
                      {Math.round(getProgressPercentage())}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={getProgressPercentage()} className="h-2 sm:h-3" />

                    {/* Mobile: Vertical Stack */}
                    <div className="block sm:hidden space-y-2">
                      {agents.map((agent) => (
                        <div
                          key={agent.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                            agentStatuses[agent.id] === "completed"
                              ? "bg-green-900/30 text-green-400"
                              : agentStatuses[agent.id] === "processing"
                                ? "bg-[#0583F2]/20 text-[#0583F2]"
                                : agentStatuses[agent.id] === "needs-review"
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {getStatusIcon(agentStatuses[agent.id])}
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: Horizontal Flow */}
                    <div className="hidden sm:flex items-center justify-between">
                      {agents.map((agent, index) => (
                        <div key={agent.id} className="flex items-center">
                          <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              agentStatuses[agent.id] === "completed"
                                ? "bg-green-900/30 text-green-400"
                                : agentStatuses[agent.id] === "processing"
                                  ? "bg-[#0583F2]/20 text-[#0583F2]"
                                  : agentStatuses[agent.id] === "needs-review"
                                    ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {getStatusIcon(agentStatuses[agent.id])}
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                          {index < agents.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agent Dashboard Grid */}
            {(isProcessing || jobData) && (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {/* Data Ingestion Agent */}
                <Card className="bg-[#1A2332] border-gray-700">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Upload className="h-4 w-4 text-[#0583F2]" />
                      </div>
                      <span className="truncate">Intake Agent</span>
                      {getStatusIcon(agentStatuses.ingestion)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.ingestion === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting to start...</p>
                      </div>
                    )}

                    {agentStatuses.ingestion === "processing" && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 text-sm text-[#0583F2]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Parsing job description...
                        </div>
                        <Skeleton className="h-16 sm:h-20 w-full bg-gray-700" />
                        <Skeleton className="h-3 sm:h-4 w-3/4 bg-gray-700" />
                      </div>
                    )}

                    {jobData && (
                      <>
                        <div>
                          <Label className="font-medium text-sm text-white">Job Analysis</Label>
                          <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                            <p className="text-sm font-medium text-white">{jobData.title}</p>
                            <p className="text-xs text-gray-300 mt-1 line-clamp-2">{jobData.description}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="font-medium text-sm text-white">Requirements Detected</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {jobData.requirements.map((req, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="font-medium text-sm text-white">Unwritten Needs (AI)</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {jobData.unwrittenNeeds.map((need, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {need}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {candidates.length > 0 && (
                          <div className="pt-2 border-t border-gray-700">
                            <p className="text-sm text-gray-300">{candidates.length} CVs processed</p>
                            <div className="space-y-2 mt-2">
                              {candidates.map((candidate) => (
                                <div key={candidate.id} className="flex items-center gap-2 text-sm text-white">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="truncate">{candidate.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Semantic Matcher Agent */}
                <Card className="bg-[#1A2332] border-gray-700">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="truncate">Insight Agent</span>
                      {getStatusIcon(agentStatuses.semantic)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.semantic === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Brain className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for data ingestion...</p>
                      </div>
                    )}

                    {agentStatuses.semantic === "processing" && (
                      <div className="space-y-3 sm:space-y-4">
                        {currentProcessingCandidate && (
                          <div className="flex items-center gap-2 text-sm text-purple-600">
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                            <span className="truncate">
                              Analyzing {candidates.find((c) => c.id === currentProcessingCandidate)?.name}...
                            </span>
                          </div>
                        )}
                        {candidates.map((candidate) => (
                          <div key={candidate.id} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
                              {currentProcessingCandidate === candidate.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-purple-500 flex-shrink-0" />
                              ) : semanticResults.find((r) => r.id === candidate.id) ? (
                                <Badge className="bg-green-900/30 text-green-400 text-xs flex-shrink-0">
                                  {semanticResults.find((r) => r.id === candidate.id)?.semanticScore}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            {semanticResults.find((r) => r.id === candidate.id) && (
                              <Progress
                                value={semanticResults.find((r) => r.id === candidate.id)?.semanticScore}
                                className="h-2 bg-gray-700"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {agentStatuses.semantic === "completed" && semanticResults.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        {semanticResults.map((candidate) => (
                          <div key={candidate.id} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
                              <Badge
                                className={`text-xs flex-shrink-0 ${
                                  (candidate.semanticScore || 0) >= 80
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-yellow-900/30 text-yellow-400"
                                }`}
                              >
                                {candidate.semanticScore}%
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 3).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              <Progress value={candidate.semanticScore} className="h-2 bg-gray-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Screening Interview Agent */}
                <Card className="bg-[#1A2332] border-gray-700">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Mic className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="truncate">Interviewer Agent</span>
                      {getStatusIcon(agentStatuses.interview)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.interview === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Mic className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for semantic analysis...</p>
                      </div>
                    )}

                    {agentStatuses.interview === "processing" && (
                      <div className="space-y-3 sm:space-y-4">
                        {currentProcessingCandidate && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                            <span className="truncate">
                              Conducting interview with{" "}
                              {candidates.find((c) => c.id === currentProcessingCandidate)?.name}
                              ...
                            </span>
                          </div>
                        )}
                        {candidates.map((candidate) => (
                          <div key={candidate.id} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
                              {currentProcessingCandidate === candidate.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-green-500 flex-shrink-0" />
                              ) : interviewResults.find((r) => r.id === candidate.id) ? (
                                <Badge className="bg-green-900/30 text-green-400 text-xs flex-shrink-0">
                                  {interviewResults.find((r) => r.id === candidate.id)?.interviewScore}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            {interviewResults.find((r) => r.id === candidate.id) && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                  {interviewResults
                                    .find((r) => r.id === candidate.id)
                                    ?.interviewResponses?.map((response, i) => (
                                      <div key={i} className="text-center">
                                        <div
                                          className={`w-full h-2 rounded ${
                                            response.score >= 80
                                              ? "bg-green-200"
                                              : response.score >= 60
                                                ? "bg-yellow-200"
                                                : "bg-red-200"
                                          }`}
                                        />
                                        <span className="text-gray-300">Q{i + 1}</span>
                                      </div>
                                    ))}
                                </div>
                                <Progress
                                  value={interviewResults.find((r) => r.id === candidate.id)?.interviewScore}
                                  className="h-2 bg-gray-700"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {agentStatuses.interview === "completed" && interviewResults.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        {interviewResults.map((candidate) => (
                          <div key={candidate.id} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
                              <Badge
                                className={`text-xs flex-shrink-0 ${
                                  (candidate.interviewScore || 0) >= 80
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-red-900/30 text-red-400"
                                }`}
                              >
                                {candidate.interviewScore}%
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-1 text-xs">
                                {candidate.interviewResponses?.map((response, i) => (
                                  <div key={i} className="text-center">
                                    <div
                                      className={`w-full h-2 rounded ${
                                        response.score >= 80
                                          ? "bg-green-200"
                                          : response.score >= 60
                                            ? "bg-yellow-200"
                                            : "bg-red-200"
                                      }`}
                                    />
                                    <span className="text-gray-300">Q{i + 1}</span>
                                  </div>
                                ))}
                              </div>
                              <Progress value={candidate.interviewScore} className="h-2 bg-gray-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Human-in-the-Loop Agent */}
                <Card className="bg-[#1A2332] border-gray-700 lg:col-span-2 xl:col-span-1">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-yellow-100">
                        <Users className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="truncate">Human Review</span>
                      {getStatusIcon(agentStatuses.human)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.human === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for interviews...</p>
                      </div>
                    )}

                    {agentStatuses.human === "needs-review" && pendingHumanReview.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="text-sm text-yellow-600 font-medium">
                          {pendingHumanReview.length} candidate(s) require human review
                        </div>
                        {pendingHumanReview.map((candidate) => (
                          <HumanReviewCard
                            key={candidate.id}
                            candidate={candidate}
                            onDecision={handleHumanDecision}
                            decisions={humanDecisions}
                          />
                        ))}
                      </div>
                    )}

                    {agentStatuses.human === "completed" && (
                      <div className="space-y-3">
                        <div className="text-sm text-green-600 font-medium">All human reviews completed</div>
                        {humanDecisions.map((decision, i) => (
                          <div key={i} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-medium text-sm truncate text-white">
                                {candidates.find((c) => c.id === decision.candidateId)?.name}
                              </span>
                              <Badge
                                variant={decision.decision === "approve" ? "default" : "destructive"}
                                className="flex-shrink-0"
                              >
                                {decision.decision}d
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2">{decision.rationale}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Memory & Learning Agent */}
                <Card className="bg-[#1A2332] border-gray-700">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Database className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="truncate">Learning Insights</span>
                      {getStatusIcon(agentStatuses.memory)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.memory === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Database className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for human decisions...</p>
                      </div>
                    )}

                    {agentStatuses.memory === "processing" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-indigo-600">
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          <span>Analyzing patterns and learning...</span>
                        </div>
                        <Skeleton className="h-12 sm:h-16 w-full bg-gray-700" />
                        <Skeleton className="h-12 sm:h-16 w-full bg-gray-700" />
                      </div>
                    )}

                    {agentStatuses.memory === "completed" && learningInsights.length > 0 && (
                      <div className="space-y-3">
                        {learningInsights.map((insight, i) => (
                          <div key={i} className="p-3 bg-[#1A2332] border border-gray-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-3 w-3 text-[#0583F2] flex-shrink-0" />
                              <span className="text-sm font-medium truncate text-white">{insight.pattern}</span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2">{insight.insight}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Final Recommendation Agent */}
                <Card className="bg-[#1A2332] border-gray-700 lg:col-span-2 xl:col-span-1">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <div className="p-2 rounded-lg bg-red-100">
                        <Target className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="truncate">Recommender Agent</span>
                      {getStatusIcon(agentStatuses.recommendation)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {agentStatuses.recommendation === "idle" && (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <Target className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for learning analysis...</p>
                      </div>
                    )}

                    {agentStatuses.recommendation === "processing" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          <span>Generating final recommendations...</span>
                        </div>
                        <Skeleton className="h-16 sm:h-20 w-full bg-gray-700" />
                        <Skeleton className="h-16 sm:h-20 w-full bg-gray-700" />
                      </div>
                    )}

                    {agentStatuses.recommendation === "completed" && finalResults.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        {finalResults
                          .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
                          .map((candidate, index) => (
                            <div
                              key={candidate.id}
                              className={`p-3 rounded-lg border-2 ${
                                candidate.status === "recommended"
                                  ? "border-green-700 bg-green-900/20"
                                  : candidate.status === "rejected"
                                    ? "border-red-700 bg-red-900/20"
                                    : "border-yellow-700 bg-yellow-900/20"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    #{index + 1}
                                  </div>
                                  <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-white">{candidate.finalScore}%</div>
                                    <Badge
                                      className={`text-xs ${
                                        candidate.status === "recommended"
                                          ? "bg-green-900/30 text-green-400"
                                          : candidate.status === "rejected"
                                            ? "bg-red-900/30 text-red-400"
                                            : "bg-yellow-900/30 text-yellow-400"
                                      }`}
                                      size="sm"
                                    >
                                      {candidate.status === "recommended"
                                        ? "Panel Interview"
                                        : candidate.status === "rejected"
                                          ? "Rejected"
                                          : "Needs Review"}
                                    </Badge>
                                  </div>
                                  <Dialog open={isBriefingDialogOpen} onOpenChange={setIsBriefingDialogOpen}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer text-xs px-2 py-1 h-8"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleViewBriefing(candidate)
                                        }}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">View Briefing</span>
                                        <span className="sm:hidden">Brief</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[#111A26] border-gray-700">
                                      <DialogHeader className="px-4 sm:px-6 py-4 border-b flex-shrink-0">
                                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                            #{index + 1}
                                          </div>
                                          <span className="truncate text-white">
                                            {selectedCandidateForBriefing?.name || candidate.name} - AI Agent Briefing
                                          </span>
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                                        {selectedCandidateForBriefing ? (
                                          <CandidateBriefing
                                            candidate={selectedCandidateForBriefing}
                                            humanDecisions={humanDecisions}
                                            agentActions={agentActions}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center p-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span className="ml-2">Loading briefing...</span>
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-300">
                                <span>Semantic: {candidate.semanticScore}%</span>
                                <span>Interview: {candidate.interviewScore}%</span>
                                <span>{candidate.highlights?.length || 0} strengths</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Welcome State */}
            {!isProcessing && !jobData && (
              <div className="text-center py-12 sm:py-16">
                <div className="max-w-2xl mx-auto px-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-[#0583F2] to-[#0583F2] flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Welcome to TalentFlowAI</h2>
                  <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8">
                    Experience the future of hiring with our multi-agent AI system. Watch as six specialized agents
                    collaborate to find the perfect candidates through semantic analysis, intelligent screening, and
                    continuous learning.
                  </p>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto mb-6 sm:mb-8">
                    <div className="p-4 bg-[#1A2332] border-gray-700 rounded-lg shadow-sm">
                      <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-[#0583F2] mx-auto mb-2" />
                      <h3 className="font-medium mb-1 text-sm sm:text-base text-white">Semantic Matching</h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Goes beyond keywords to understand meaning and intent
                      </p>
                    </div>
                    <div className="p-4 bg-[#1A2332] border-gray-700 rounded-lg shadow-sm">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
                      <h3 className="font-medium mb-1 text-sm sm:text-base text-white">Human-AI Collaboration</h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        AI assists, humans decide on critical hiring choices
                      </p>
                    </div>
                    <div className="p-4 bg-[#1A2332] border-gray-700 rounded-lg shadow-sm">
                      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mx-auto mb-2" />
                      <h3 className="font-medium mb-1 text-sm sm:text-base text-white">Continuous Learning</h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Improves recommendations based on hiring outcomes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="mt-4 sm:mt-6">
            {/* Review Inbox */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Action Log */}
              <Card className="bg-[#1A2332] border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Agent Action Log
                    <Badge variant="secondary" className="text-xs">
                      {agentActions.length} actions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80 sm:h-96">
                    {agentActions.length > 0 ? (
                      <div className="space-y-3">
                        {agentActions
                          .slice()
                          .reverse()
                          .map((action) => (
                            <div
                              key={action.id}
                              className={`p-3 rounded-lg border ${getActionStatusColor(action.status)}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-1 rounded bg-white/50 flex-shrink-0">{getActionIcon(action)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate text-white">
                                        {action.agentName}
                                      </span>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {action.action}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {action.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm line-clamp-2 text-gray-200">{action.details}</p>
                                  {action.candidateName && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Eye className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-xs text-gray-300 truncate">{action.candidateName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No actions recorded yet</p>
                        <p className="text-xs">Start the pipeline to see agent activities</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Automation Issues */}
              <Card className="bg-[#1A2332] border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <span className="truncate">Automation Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* AI Mistakes */}
                    {agentActions.filter((a) => a.status === "error" || a.status === "warning").length > 0 ? (
                      <div className="space-y-3">
                        {agentActions
                          .filter((a) => a.status === "error" || a.status === "warning")
                          .map((action) => (
                            <div key={action.id} className="p-3 border rounded-lg bg-yellow-900/20 border-yellow-700">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-yellow-400 truncate">{action.agentName}</p>
                                  <p className="text-sm text-yellow-300 line-clamp-2">{action.details}</p>
                                  {action.candidateName && (
                                    <p className="text-xs text-yellow-300 mt-1 truncate">
                                      Candidate: {action.candidateName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                        {/* Human Overrides */}
                        {agentActions.filter((a) => a.action === "AI Override").length > 0 && (
                          <div className="mt-4">
                            <Label className="font-medium text-sm text-white">Human Overrides</Label>
                            <div className="space-y-2 mt-2">
                              {agentActions
                                .filter((a) => a.action === "AI Override")
                                .map((action) => (
                                  <div
                                    key={action.id}
                                    className="p-2 bg-red-900/20 border border-red-700 rounded text-sm"
                                  >
                                    <div className="flex items-start gap-2">
                                      <ThumbsDown className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                                      <span className="text-red-300 line-clamp-2">{action.details}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-400">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No automation issues detected</p>
                        <p className="text-xs">All agents performing optimally</p>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    {agentActions.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-700">
                        <Label className="font-medium text-sm text-white">Performance Summary</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="text-center p-2 bg-green-900/20 border border-green-700 rounded">
                            <div className="text-lg font-bold text-green-400">
                              {agentActions.filter((a) => a.status === "success").length}
                            </div>
                            <div className="text-xs text-green-300">Successful Actions</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-900/20 border border-yellow-700 rounded">
                            <div className="text-lg font-bold text-yellow-400">
                              {agentActions.filter((a) => a.status === "warning" || a.status === "error").length}
                            </div>
                            <div className="text-xs text-yellow-300">Issues Detected</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Candidate Briefing Component
function CandidateBriefing({
  candidate,
  humanDecisions,
  agentActions,
}: {
  candidate: Candidate
  humanDecisions: Array<{ candidateId: string; decision: string; rationale: string; timestamp: Date }>
  agentActions: AgentAction[]
}) {
  const candidateActions = agentActions.filter((action) => action.candidateId === candidate.id)
  const humanDecision = humanDecisions.find((d) => d.candidateId === candidate.id)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Executive Summary */}
      <Card className="bg-[#1A2332] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-4 w-4 text-blue-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
            <div className={`p-3 sm:p-4 rounded-lg ${getScoreColor(candidate.semanticScore || 0)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Semantic Match</span>
                {getScoreIcon(candidate.semanticScore || 0)}
              </div>
              <div className="text-xl sm:text-2xl font-bold">{candidate.semanticScore}%</div>
              <p className="text-xs sm:text-sm mt-1 line-clamp-2">
                {(candidate.semanticScore || 0) >= 80
                  ? "Excellent fit for role requirements"
                  : (candidate.semanticScore || 0) >= 60
                    ? "Good match with some gaps"
                    : "Poor alignment with job needs"}
              </p>
            </div>

            <div className={`p-3 sm:p-4 rounded-lg ${getScoreColor(candidate.interviewScore || 0)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Interview Performance</span>
                {getScoreIcon(candidate.interviewScore || 0)}
              </div>
              <div className="text-xl sm:text-2xl font-bold">{candidate.interviewScore}%</div>
              <p className="text-xs sm:text-sm mt-1 line-clamp-2">
                {(candidate.interviewScore || 0) >= 80
                  ? "Strong communication and cultural fit"
                  : (candidate.interviewScore || 0) >= 60
                    ? "Adequate responses with room for improvement"
                    : "Concerning communication patterns"}
              </p>
            </div>

            <div className={`p-3 sm:p-4 rounded-lg ${getScoreColor(candidate.finalScore || 0)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Final Recommendation</span>
                {getScoreIcon(candidate.finalScore || 0)}
              </div>
              <div className="text-xl sm:text-2xl font-bold">{candidate.finalScore}%</div>
              <p className="text-xs sm:text-sm mt-1 line-clamp-2">
                {candidate.status === "recommended"
                  ? "Recommended for panel interview"
                  : candidate.status === "rejected"
                    ? "Not suitable for this role"
                    : "Requires human review"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Analysis Breakdown */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Data Ingestion Analysis */}
        <Card className="bg-[#1A2332] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
              <Upload className="h-4 w-4 text-[#0583F2]" />
              Data Ingestion Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <Label className="font-medium text-sm text-white">CV Parsing Results</Label>
              <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm line-clamp-3 text-gray-300">{candidate.experience}</p>
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm text-white">Extracted Skills</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm text-white">Agent Decision</Label>
              <p className="text-sm text-gray-300 mt-1 line-clamp-3">
                Successfully parsed candidate profile with {candidate.skills.length} identified skills. Profile
                structure indicates{" "}
                {candidate.skills.includes("Team Leadership") ? "leadership" : "individual contributor"} experience.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Semantic Matching Analysis */}
        <Card className="bg-[#1A2332] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
              <Brain className="h-4 w-4 text-purple-600" />
              Semantic Matching Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <Label className="font-medium text-sm text-white">Skill Alignment</Label>
              <div className="space-y-2 mt-2">
                {candidate.skills.slice(0, 4).map((skill, i) => {
                  const isMatch = ["React", "WCAG", "Accessibility", "Team Leadership", "Mentoring"].includes(skill)
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate text-gray-300">{skill}</span>
                      <Badge variant={isMatch ? "default" : "outline"} className="text-xs flex-shrink-0">
                        {isMatch ? "Strong Match" : "Partial Match"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm text-white">Semantic Reasoning</Label>
              <div className="space-y-2 mt-2">
                {candidate.highlights?.slice(0, 3).map((highlight, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2 text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm text-white">Agent Decision</Label>
              <p className="text-sm text-gray-300 mt-1 line-clamp-3">
                Semantic analysis reveals{" "}
                {(candidate.semanticScore || 0) >= 80
                  ? "strong"
                  : (candidate.semanticScore || 0) >= 60
                    ? "moderate"
                    : "weak"}
                alignment with role requirements. Key factors: {candidate.highlights?.length || 0} positive indicators,{" "}
                {candidate.concerns?.length || 0} areas of concern.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interview Analysis */}
        <Card className="bg-[#1A2332] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
              <Mic className="h-4 w-4 text-green-500" />
              Interview Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <Label className="font-medium text-sm text-white">Question-by-Question Breakdown</Label>
              <div className="space-y-3 mt-2">
                {candidate.interviewResponses?.map((response, i) => (
                  <div key={i} className="border rounded-lg p-3 border-gray-700">
                    <div className="flex items-center justify-between mb-2 gap-2 text-white">
                      <span className="font-medium text-sm">Question {i + 1}</span>
                      <Badge
                        variant={response.score >= 80 ? "default" : response.score >= 60 ? "secondary" : "destructive"}
                        className="text-xs flex-shrink-0"
                      >
                        {response.score}/100
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-2 line-clamp-2 text-gray-300">{response.question}</p>
                    <div className="bg-gray-800 p-2 rounded text-sm mb-2">
                      <span className="font-medium text-white">Response: </span>
                      <span className="line-clamp-3 text-gray-300">{response.answer}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="font-medium">AI Analysis: </span>
                      <span className="line-clamp-2 text-gray-300">
                        {response.score >= 80
                          ? "Excellent response showing deep understanding and relevant experience"
                          : response.score >= 60
                            ? "Adequate response with some relevant points but lacking depth"
                            : "Poor response indicating limited experience or understanding"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm text-white">Agent Decision</Label>
              <p className="text-sm text-gray-300 mt-1 line-clamp-3">
                Interview performance indicates{" "}
                {(candidate.interviewScore || 0) >= 80
                  ? "strong"
                  : (candidate.interviewScore || 0) >= 60
                    ? "adequate"
                    : "poor"}
                communication skills and cultural alignment.
                {(candidate.interviewScore || 0) < 60 &&
                  " Concerns about team collaboration and mentorship capabilities."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Human Review Analysis */}
        <Card className="bg-[#1A2332] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
              <Users className="h-4 w-4 text-yellow-500" />
              Human Review Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {humanDecision ? (
              <>
                <div>
                  <Label className="font-medium text-sm text-white">Human Decision</Label>
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="font-medium truncate text-white">
                        Decision: {humanDecision.decision.toUpperCase()}
                      </span>
                      <Badge
                        variant={humanDecision.decision === "approve" ? "default" : "destructive"}
                        className="flex-shrink-0"
                      >
                        {humanDecision.decision}d
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-3 text-gray-300">{humanDecision.rationale}</p>
                    <p className="text-xs text-gray-500 mt-2">Decided on {humanDecision.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-white">AI vs Human Alignment</Label>
                  <div className="mt-2">
                    {(() => {
                      const aiRecommendation = (candidate.finalScore || 0) >= 70 ? "approve" : "reject"
                      const isOverride = aiRecommendation !== humanDecision.decision
                      return (
                        <div
                          className={`p-3 rounded-lg ${isOverride ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}
                        >
                          <div className="flex items-center gap-2">
                            {isOverride ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-300">
                              {isOverride ? "Human Override" : "AI-Human Alignment"}
                            </span>
                          </div>
                          <p className="text-sm mt-1 line-clamp-2 text-gray-300">
                            {isOverride
                              ? `Human overrode AI recommendation (AI: ${aiRecommendation}, Human: ${humanDecision.decision})`
                              : "Human decision aligns with AI recommendation"}
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-400">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No human review required</p>
                <p className="text-xs">AI confidence above threshold</p>
              </div>
            )}
            <div>
              <Label className="font-medium text-sm text-white">Risk Assessment</Label>
              <div className="space-y-2 mt-2">
                {candidate.concerns && candidate.concerns.length > 0 ? (
                  candidate.concerns.map((concern, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 text-gray-300">{concern}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>No significant risk factors identified</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Action Timeline */}
      <Card className="bg-[#1A2332] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
            Agent Decision Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidateActions.length > 0 ? (
              candidateActions.map((action, i) => (
                <div key={action.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`p-2 rounded-full ${
                        action.status === "success"
                          ? "bg-green-900/20"
                          : action.status === "warning"
                            ? "bg-yellow-900/20"
                            : "bg-red-900/20"
                      }`}
                    >
                      {action.agentId === "ingestion" && <Upload className="h-4 w-4 text-[#0583F2]" />}
                      {action.agentId === "semantic" && <Brain className="h-4 w-4 text-purple-600" />}
                      {action.agentId === "interview" && <Mic className="h-4 w-4 text-green-500" />}
                      {action.agentId === "human" && <Users className="h-4 w-4 text-yellow-500" />}
                      {action.agentId === "recommendation" && <Target className="h-4 w-4 text-red-500" />}
                    </div>
                    {i < candidateActions.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-medium text-sm truncate text-white">{action.agentName}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {action.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mb-1 line-clamp-2">{action.details}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        action.status === "success"
                          ? "border-green-800 text-green-400"
                          : action.status === "warning"
                            ? "border-yellow-800 text-yellow-400"
                            : "border-red-800 text-red-400"
                      }`}
                    >
                      {action.action}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No specific actions recorded for this candidate</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Final Recommendation */}
      <Card className="bg-[#1A2332] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            Final AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`p-4 rounded-lg border-2 ${
              candidate.status === "recommended"
                ? "border-green-900/30 bg-green-900/10"
                : candidate.status === "rejected"
                  ? "border-red-900/30 bg-red-900/10"
                  : candidate.status === "needs-review"
                    ? "border-yellow-900/30 bg-yellow-900/10"
                    : ""
            }`}
          >
            <p className="text-sm font-medium text-white">
              AI recommends:{" "}
              {candidate.status === "recommended"
                ? "Panel Interview"
                : candidate.status === "rejected"
                  ? "Rejection"
                  : "Further Review"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Based on semantic match, interview performance, and human review (if applicable).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Human Review Card Component
function HumanReviewCard({
  candidate,
  onDecision,
  decisions,
}: {
  candidate: Candidate
  onDecision: (candidateId: string, decision: "approve" | "reject", rationale: string) => void
  decisions: Array<{ candidateId: string; decision: string; rationale: string; timestamp: Date }>
}) {
  const [rationale, setRationale] = useState("")
  const existingDecision = decisions.find((d) => d.candidateId === candidate.id)

  return (
    <div className="p-3 border rounded-lg border-gray-700">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-medium text-sm truncate text-white">{candidate.name}</span>
        <Badge className="bg-yellow-900/30 text-yellow-400 flex-shrink-0">Needs Review</Badge>
      </div>
      <p className="text-xs text-gray-300 mb-2 line-clamp-2">
        AI Confidence: {candidate.finalScore}% - Concerns: {candidate.concerns?.join(", ") || "None"}
      </p>
      {existingDecision ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600 font-medium">You already {existingDecision.decision}d this candidate</p>
          <p className="text-xs text-gray-300 line-clamp-2">Rationale: {existingDecision.rationale}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            placeholder="Enter your rationale for approving or rejecting this candidate..."
            className="text-sm resize-none h-20"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDecision(candidate.id, "reject", rationale)
                setRationale("")
              }}
              className="text-xs px-3 py-1 h-8"
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onDecision(candidate.id, "approve", rationale)
                setRationale("")
              }}
              className="text-xs px-3 py-1 h-8"
            >
              Approve
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
