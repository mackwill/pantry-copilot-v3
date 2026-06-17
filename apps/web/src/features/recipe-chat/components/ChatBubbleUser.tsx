import styles from '../recipe-chat.module.css';

/** The cook's tweak message (board §✦ — inverse bubble, right-aligned). */
export function ChatBubbleUser({ text }: { text: string }) {
  return (
    <div className={styles['bubbleUserRow']}>
      <div className={styles['bubbleUser']}>{text}</div>
    </div>
  );
}
