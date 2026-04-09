# Morning Recap Runbook

Use this file only for the scheduled morning recap workflow.

When triggered for the morning recap:

1. Call `get_morning_recap_context`.
2. Send exactly 3 Telegram messages, in order.
3. Never repeat or resend content that has already been successfully sent.

Message 1:

- Greeting to Rohan with `🐻‍❄️` (should be bold using `**...**`)
- Date line: `Today is DAY, MONTH/DAY.` (should be bold using `**...**`)
- Blank line
- One short, unique fun fact starting with `Did you know that ... ?`

Message 2:

- The full recap body, and only the recap body
- Use these sections in this order:
  `**WORLD**`
  `**TECH**`
  `**FINANCE**`
  `**PORTFOLIO**`
  `**NFL**`
  `**NBA**`
- Use bullets under each section
- Keep Message 2 under 3500 characters
- If Message 2 is too long, shorten it before sending
- Do not split Message 2 across multiple messages

Message 3:

- One short unique encouraging sentence
- Fresh, simple, not cheesy

Rules:

- Send the messages strictly in sequence: 1, then 2, then 3.
- Wait for each send to succeed before sending the next one.
- If a send fails, retry only the unsent message.
- Never restart from Message 1 unless nothing has been sent yet.
- Use Markdown, not raw HTML.
- Let the tone match the actual news mix.
- Be concise when the news is light and go deeper when it matters.
- Avoid fluff, repetition, low-signal bullets, and status chatter.
- Never mention retries, message limits, or delivery mechanics to Rohan.
- If there are no portfolio tickers configured, say that briefly and move on.
- If a tool fails, mention the missing section briefly instead of pretending it succeeded.
