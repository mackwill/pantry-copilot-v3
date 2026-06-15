import { Eyebrow } from '@pantry/design-system/web';
import type { ToolEvent } from '@pantry/contracts';
import type { TranscriptEntry } from '../useGeneration';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.thinking;

/** One terminal-flavored tool line: › name(arg) → result, caret while pending. */
function ToolEventRow({ tool }: { tool: ToolEvent }) {
  return (
    <div className={styles['toolRow']}>
      <span className={styles['toolBullet']}>{'›'}</span>
      <span>
        <span className={styles['toolName']}>{tool.display}</span>
        {tool.result !== null && (
          <>
            <span className={styles['toolArrow']}>{'→'}</span>
            <span className={styles['toolResult']}>{tool.result}</span>
          </>
        )}
        {tool.state === 'pending' && <span className={styles['caret']} />}
      </span>
    </div>
  );
}

export interface ThinkingPanelProps {
  transcript: readonly TranscriptEntry[];
  toolCount: number;
  elapsed: string;
}

/** Board §04 Thinking — pulsing header + the interleaved prose/tool stream. */
export function ThinkingPanel({ transcript, toolCount, elapsed }: ThinkingPanelProps) {
  const lastIndex = transcript.length - 1;
  return (
    <>
      <div className={styles['thinkingHeader']}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          <span className={styles['thinkDot']} />
          {s.header}
        </Eyebrow>
        <span className={styles['thinkingHeaderMeta']}>{`${elapsed} · ${s.toolCount(toolCount)}`}</span>
      </div>
      <div className={styles['prose']}>
        {transcript.map((entry, index) =>
          entry.kind === 'prose' ? (
            <p key={`prose-${index.toString()}`} className={styles['thinkLine']}>
              {entry.text}
              {index === lastIndex && <span className={styles['caret']} />}
            </p>
          ) : (
            <ToolEventRow key={entry.tool.id} tool={entry.tool} />
          ),
        )}
      </div>
    </>
  );
}
