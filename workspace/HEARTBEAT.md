# Morning Recap Runbook

Use this file only for the scheduled morning recap workflow.

When triggered by cron for the morning recap:

1. Call `get_morning_recap_context`.
2. Deliver the recap as three Telegram messages, not one big message.
3. Cover these sections in this order:
   WORLD
   TECH
   FINANCE
   PORTFOLIO
   NFL
   NBA
4. In WORLD:
   summarize the most important global stories first.
5. In TECH:
   focus on AI launches, model releases, platform changes, regulation, and notable industry drama.
6. In FINANCE:
   summarize the most important market-moving headlines,
   then give a brief forecast for the US market session,
   then name the biggest risks to that forecast.
7. In PORTFOLIO:
   summarize ticker-specific news for the configured holdings after the general finance section.
   Be more detailed when there is real company-specific movement, earnings, product news, regulatory pressure, or sentiment shift.
8. In NFL:
   summarize the most relevant NFL headlines, matchups, injuries, rumors, or major narratives.
   Keep it to mostly important or cool things. Do not pad the section just to make it longer.
9. In NBA:
   summarize the most relevant NBA headlines, matchups, injuries, rumors, or major narratives.
   Keep it to mostly important or cool things. Do not pad the section just to make it longer.

Delivery format:

- Message 1 is the opener only.
- Message 1 should contain:
  a bold greeting to Rohan using your token emoji `🐻‍❄️`,
  a bold date line in this form: `Today is DAY, MONTH/DAY.`,
  a blank line,
  one random fun fact starting with `Did you know that ... ?`
- Message 2 should contain the full recap body in this order:
  `**WORLD**`,
  `**TECH**`,
  `**FINANCE**`,
  `**PORTFOLIO**`,
  `**NFL**`,
  `**NBA**`
- Message 3 should be one short encouraging sentence about the day.

Formatting rules:

- Let the tone match the actual news mix.
- Format for Telegram readability.
- Use Markdown, not raw HTML tags.
- Use bold Markdown section headers like `**WORLD**`.
- Keep formatting simple enough that the message still reads cleanly if Markdown conversion is not preserved.
- Use the exact heading text shown above.
- Use bullet points under each heading.
- Send the Telegram messages strictly in sequence.
- Do not prepare or send all messages at once.
- Send Message 1 first and wait for the send tool to succeed.
- Only after Message 1 succeeds, send Message 2.
- Only after Message 2 succeeds, send Message 3.
- Keep Message 2 under 3750 characters.
- Keep all other individual Telegram messages under 3750 characters.
- Keep it concise when the news is light and go deeper when the news is genuinely important.
- Avoid repetition, filler, and low-signal bullets.
- If there are no portfolio tickers configured, say that briefly and move on.
- If a tool fails, mention the missing section briefly instead of pretending it succeeded.
- The final encouraging sentence should feel fresh and simple, not cheesy.
- Never send status updates about message limits, retries, or delivery mechanics to Rohan.
