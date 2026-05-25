import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import type {
  AcknowledgmentCompletion,
  ChecklistCompletion,
  Lesson,
  LessonContent,
  OrderingCompletion,
  ScenarioCompletion,
  VideoCheckpointProgress,
} from '@/lib/education';
import { LessonScaffold } from './LessonScaffold';
import { Quiz } from './Quiz';
import { AcknowledgmentLesson } from './lessons/AcknowledgmentLesson';
import { ChecklistLesson } from './lessons/ChecklistLesson';
import { ScenarioLesson } from './lessons/ScenarioLesson';
import { HotspotLesson } from './lessons/HotspotLesson';
import { OrderingLesson } from './lessons/OrderingLesson';
import { VideoLesson } from './lessons/VideoLesson';

interface Props {
  lesson: Lesson;
  lessonNumber?: number;
  totalLessons?: number;
  onQuizComplete?: (score: number, passed: boolean, answers: Record<string, number>) => void;
  onAcknowledge?: (completion: AcknowledgmentCompletion) => void;
  onChecklistComplete?: (completion: ChecklistCompletion) => void;
  onScenarioComplete?: (completion: ScenarioCompletion) => void;
  onOrderingComplete?: (completion: OrderingCompletion) => void;
  onVideoCheckpointProgress?: (progress: VideoCheckpointProgress) => void;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled lesson content variant: ${JSON.stringify(value)}`);
}

function comingSoonLabel(contentType: LessonContent['type']) {
  return contentType.replace(/_/g, ' ');
}

function objectiveForLesson(lesson: Lesson): string {
  switch (lesson.content.type) {
    case 'text':
      return 'Read the source-grounded explanation and identify the key action to take.';
    case 'checklist':
      return 'Work through each required step and confirm what must be done in order.';
    case 'acknowledgment':
      return 'Review the policy statement and record your acknowledgment when ready.';
    case 'quiz':
      return 'Check your understanding and confirm you can apply the lesson correctly.';
    case 'scenario':
      return 'Practice a realistic Redex decision and learn from the outcome.';
    case 'video':
      return 'Watch the segment and connect the visual example to the training objective.';
    case 'coach':
      return 'Use guided prompts to reason through the lesson in a Redex context.';
    case 'assignment':
      return 'Complete the practical deliverable using the lesson instructions.';
    case 'reflection_prompt':
      return 'Reflect on the prompt and connect it to your day-to-day work.';
    case 'hotspot_diagram':
      return 'Explore the diagram and identify what each highlighted area means.';
    case 'drag_to_order':
      return 'Put the procedure in the correct order so you can recall and apply it on the job.';
    default:
      return assertNever(lesson.content);
  }
}

function ComingSoonLesson({ contentType }: { contentType: LessonContent['type'] }) {
  return (
    <div className="rounded-2xl border border-dashed border-redex-red/35 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[3px] text-redex-red">Renderer coming soon</p>
      <h3 className="mt-3 text-xl font-semibold capitalize tracking-tight text-slate-900">
        {comingSoonLabel(contentType)} lesson support
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This lesson type is defined in the content model and will get a dedicated Phase 10 renderer. Until then,
        this explicit state prevents a silent fallback or broken gray placeholder.
      </p>
    </div>
  );
}

export function LessonContentRenderer({
  lesson,
  lessonNumber,
  totalLessons,
  onQuizComplete,
  onAcknowledge,
  onChecklistComplete,
  onScenarioComplete,
  onOrderingComplete,
  onVideoCheckpointProgress,
}: Props) {
  const { content } = lesson;

  switch (content.type) {
    case 'video':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <VideoLesson key={lesson.id} lessonId={lesson.id} content={content} onCheckpointProgress={onVideoCheckpointProgress} />
        </LessonScaffold>
      );

    case 'text': {
      const markdownBody = content.body_markdown || 'Text lesson content would render here as rich markdown.';

      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="prose max-w-none text-slate-700">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdownBody}</ReactMarkdown>
            </div>
          </div>
        </LessonScaffold>
      );
    }

    case 'quiz':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <Quiz key={lesson.id} lesson={lesson} onComplete={onQuizComplete} />
        </LessonScaffold>
      );

    case 'acknowledgment':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <AcknowledgmentLesson key={lesson.id} lessonId={lesson.id} content={content} onAcknowledge={onAcknowledge} />
        </LessonScaffold>
      );

    case 'checklist':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <ChecklistLesson key={lesson.id} lessonId={lesson.id} content={content} onComplete={onChecklistComplete} />
        </LessonScaffold>
      );

    case 'scenario':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <ScenarioLesson key={lesson.id} lessonId={lesson.id} content={content} onComplete={onScenarioComplete} />
        </LessonScaffold>
      );

    case 'hotspot_diagram':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <HotspotLesson key={lesson.id} content={content} />
        </LessonScaffold>
      );

    case 'drag_to_order':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <OrderingLesson key={lesson.id} lessonId={lesson.id} content={content} onComplete={onOrderingComplete} />
        </LessonScaffold>
      );

    case 'coach':
    case 'assignment':
    case 'reflection_prompt':
      return (
        <LessonScaffold lesson={lesson} lessonNumber={lessonNumber} totalLessons={totalLessons} objective={objectiveForLesson(lesson)}>
          <ComingSoonLesson contentType={content.type} />
        </LessonScaffold>
      );

    default:
      return assertNever(content);
  }
}
