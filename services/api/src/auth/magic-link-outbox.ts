export interface MagicLinkMessage {
  email: string;
  url: string;
}

/** Captures the most recent magic link instead of emailing it (M1: no email provider). */
export class MagicLinkOutbox {
  #last: MagicLinkMessage | undefined;

  record(message: MagicLinkMessage): void {
    this.#last = message;
  }

  takeLast(): MagicLinkMessage | undefined {
    const message = this.#last;
    this.#last = undefined;
    return message;
  }
}
